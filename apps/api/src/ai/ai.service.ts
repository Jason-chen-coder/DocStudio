import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiConfigService } from './ai-config.service';
import { AiCompletionDto } from './dto/ai-completion.dto';
import { AiChatDto } from './dto/ai-chat.dto';
import { PROMPTS } from './prompts';
import {
  streamChatCompletion,
  type ChatMessage,
  type StreamChunk,
} from './providers/openai-compatible.provider';
import { getPlanDailyLimit, PLAN_MODELS } from './ai-subscription-plan.config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private configService: AiConfigService,
  ) {}

  /**
   * Check if user has exceeded daily usage limit
   */
  async checkUsageLimit(userId: string, planOverride?: string, billingPeriod?: string): Promise<{ allowed: boolean; used: number; limit: number }> {
    const config = await this.configService.getEffectiveConfig();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use plan-specific limit if subscription exists, otherwise fall back to global config
    const dailyLimit = planOverride
      ? getPlanDailyLimit(planOverride, billingPeriod || 'MONTHLY')
      : config.dailyLimit;

    const used = await this.prisma.aiUsageLog.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    return {
      allowed: used < dailyLimit,
      used,
      limit: dailyLimit,
    };
  }

  /**
   * Stream AI completion
   */
  async *completion(
    userId: string,
    dto: AiCompletionDto,
    subscriptionPlan?: string,
    billingPeriod?: string,
  ): AsyncGenerator<StreamChunk> {
    // Check usage limit (plan-aware)
    const { allowed, used, limit } = await this.checkUsageLimit(userId, subscriptionPlan, billingPeriod);
    if (!allowed) {
      yield {
        type: 'error',
        error: `今日 AI 用量已达上限（${used}/${limit}），请明天再试`,
      };
      return;
    }

    // Get config
    const config = await this.configService.getEffectiveConfig();
    if (!config.apiKey) {
      yield { type: 'error', error: '未配置 AI API Key，请联系管理员' };
      return;
    }

    // Build messages
    const prompt = PROMPTS[dto.command];
    if (!prompt) {
      yield { type: 'error', error: `未知命令: ${dto.command}` };
      return;
    }

    const userContent = prompt.userTemplate({
      text: dto.text,
      context: dto.context,
      customPrompt: dto.customPrompt,
      language: dto.language,
    });

    // If deep thinking is enabled, allow <think> tags; otherwise suppress them
    const systemContent = dto.deepThink
      ? prompt.system + '\n\n如果你需要思考，请将思考过程放在 <think></think> 标签内。标签外的内容将直接展示给用户。'
      : prompt.system + '\n\n重要：不要输出你的思考过程，不要输出 <think> 标签，只输出最终结果。';

    const messages: ChatMessage[] = [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent },
    ];

    // Stream
    const startTime = Date.now();
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of streamChatCompletion(config, messages)) {
      if (chunk.type === 'usage') {
        inputTokens = chunk.inputTokens || 0;
        outputTokens = chunk.outputTokens || 0;
      }
      yield chunk;
    }

    // Log usage (fire-and-forget)
    const latencyMs = Date.now() - startTime;
    this.prisma.aiUsageLog
      .create({
        data: {
          userId,
          command: dto.command,
          model: config.model,
          inputTokens,
          outputTokens,
          latencyMs,
        },
      })
      .catch((err) => this.logger.error('Failed to log AI usage', err));
  }

  /**
   * Stream AI chat with document context
   */
  async *chat(
    userId: string,
    dto: AiChatDto,
    subscriptionPlan?: string,
    billingPeriod?: string,
  ): AsyncGenerator<StreamChunk> {
    // Check usage limit (plan-aware)
    const { allowed, used, limit } = await this.checkUsageLimit(userId, subscriptionPlan, billingPeriod);
    if (!allowed) {
      yield {
        type: 'error',
        error: `今日 AI 用量已达上限（${used}/${limit}），请明天再试`,
      };
      return;
    }

    const config = await this.configService.getEffectiveConfig();
    if (!config.apiKey) {
      yield { type: 'error', error: '未配置 AI API Key，请联系管理员' };
      return;
    }

    // Build system prompt with document context
    let systemPrompt = `你是一个文档 AI 助手。用户正在阅读或编辑一篇文档，你可以根据文档内容回答问题、提供建议。
要求：
- 回答要简洁、准确、有帮助
- 如果用户的问题与文档内容相关，优先基于文档内容回答
- 使用与文档相同的语言回答
- 如果用户要求生成内容，可以直接输出`;

    if (dto.documentContent) {
      // Truncate document content to avoid token limits (~8000 chars ≈ 3000 tokens)
      const maxLen = 8000;
      const content =
        dto.documentContent.length > maxLen
          ? dto.documentContent.slice(0, maxLen) + '\n\n[文档内容过长，已截断...]'
          : dto.documentContent;
      systemPrompt += `\n\n以下是用户当前文档的内容：\n---\n${content}\n---`;
    }

    // If model uses <think> tags, the frontend handles rendering.
    // But prevent raw thinking text from leaking for models that don't use tags.
    systemPrompt += '\n\n如果你需要思考，请将思考过程放在 <think></think> 标签内。标签外的内容将直接展示给用户。';

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...dto.messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    const startTime = Date.now();
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of streamChatCompletion(config, messages)) {
      if (chunk.type === 'usage') {
        inputTokens = chunk.inputTokens || 0;
        outputTokens = chunk.outputTokens || 0;
      }
      yield chunk;
    }

    // Log usage
    const latencyMs = Date.now() - startTime;
    this.prisma.aiUsageLog
      .create({
        data: {
          userId,
          command: 'chat',
          model: config.model,
          inputTokens,
          outputTokens,
          latencyMs,
        },
      })
      .catch((err) => this.logger.error('Failed to log AI usage', err));
  }

  /**
   * Get user's usage stats
   */
  async getUsage(userId: string) {
    const config = await this.configService.getEffectiveConfig();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayUsed, totalUsed] = await Promise.all([
      this.prisma.aiUsageLog.count({
        where: { userId, createdAt: { gte: today } },
      }),
      this.prisma.aiUsageLog.count({
        where: { userId },
      }),
    ]);

    return {
      todayUsed,
      dailyLimit: config.dailyLimit,
      totalUsed,
    };
  }

  /**
   * Get admin usage summary (today's totals)
   */
  async getAdminUsageSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayRequests, todayTokens] = await Promise.all([
      this.prisma.aiUsageLog.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.aiUsageLog.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { inputTokens: true, outputTokens: true },
      }),
    ]);

    return {
      todayRequests,
      todayTokens:
        (todayTokens._sum.inputTokens || 0) +
        (todayTokens._sum.outputTokens || 0),
    };
  }
}
