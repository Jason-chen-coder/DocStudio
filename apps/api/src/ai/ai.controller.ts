import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { AiService } from './ai.service';
import { AiConfigService } from './ai-config.service';
import { AiCompletionDto } from './dto/ai-completion.dto';
import { AiChatDto } from './dto/ai-chat.dto';
import { UpdateAiConfigDto, ResetAiConfigFieldDto } from './dto/ai-config.dto';
import { AiSubscriptionGuard } from './guards/ai-subscription.guard';
import type { FastifyReply } from 'fastify';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiConfigService: AiConfigService,
  ) {}

  @Post('completion')
  @UseGuards(JwtAuthGuard, AiSubscriptionGuard)
  @ApiOperation({ summary: 'AI 文本补全（SSE 流式）' })
  async completion(
    @Body() dto: AiCompletionDto,
    @Req() req: any,
    @Res() reply: FastifyReply,
  ) {
    const userId = req.user.id;
    const origin = process.env.FRONTEND_URL || 'http://localhost:3000';

    // SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    });

    const plan = req.aiSubscription?.plan;
    const billing = req.aiSubscription?.billingPeriod;

    try {
      for await (const chunk of this.aiService.completion(userId, dto, plan, billing)) {
        reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    } catch (error: any) {
      reply.raw.write(
        `data: ${JSON.stringify({ type: 'error', error: error.message || 'AI 服务异常' })}\n\n`,
      );
    }

    reply.raw.end();
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard, AiSubscriptionGuard)
  @ApiOperation({ summary: 'AI 文档对话（SSE 流式）' })
  async chat(
    @Body() dto: AiChatDto,
    @Req() req: any,
    @Res() reply: FastifyReply,
  ) {
    const userId = req.user.id;
    const plan = req.aiSubscription?.plan;
    const billing = req.aiSubscription?.billingPeriod;
    const origin = process.env.FRONTEND_URL || 'http://localhost:3000';

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    });

    try {
      for await (const chunk of this.aiService.chat(userId, dto, plan, billing)) {
        reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    } catch (error: any) {
      reply.raw.write(
        `data: ${JSON.stringify({ type: 'error', error: error.message || 'AI 服务异常' })}\n\n`,
      );
    }

    reply.raw.end();
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '查询个人 AI 用量' })
  getUsage(@Req() req: any) {
    return this.aiService.getUsage(req.user.id);
  }

  // ── Admin endpoints ──

  @Get('config')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '获取 AI 配置（Admin）' })
  getConfig() {
    return this.aiConfigService.getConfigWithSource();
  }

  @Patch('config')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '更新 AI 配置（Admin）' })
  async updateConfig(@Body() dto: UpdateAiConfigDto) {
    await this.aiConfigService.updateConfig(dto);
    return this.aiConfigService.getConfigWithSource();
  }

  @Post('config/reset')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '重置 AI 配置字段为默认值（Admin）' })
  async resetField(@Body() dto: ResetAiConfigFieldDto) {
    await this.aiConfigService.resetField(dto.field);
    return this.aiConfigService.getConfigWithSource();
  }

  @Get('admin/usage')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: '获取全局 AI 用量统计（Admin）' })
  getAdminUsage() {
    return this.aiService.getAdminUsageSummary();
  }
}
