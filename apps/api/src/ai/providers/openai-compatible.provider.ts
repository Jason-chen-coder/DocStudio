import OpenAI from 'openai';
import type { EffectiveAiConfig } from '../ai-config.service';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChunk {
  type: 'text' | 'usage' | 'done' | 'error';
  content?: string;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}

/**
 * OpenAI-compatible LLM provider.
 * Works with OpenAI, MiniMax, DeepSeek, Moonshot, 通义千问, local Ollama, etc.
 * Just change baseURL and apiKey.
 */
export async function* streamChatCompletion(
  config: EffectiveAiConfig,
  messages: ChatMessage[],
): AsyncGenerator<StreamChunk> {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });

  try {
    const stream = await client.chat.completions.create({
      model: config.model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    let totalContent = '';

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        totalContent += delta;
        yield { type: 'text', content: delta };
      }
    }

    // Usage info (estimate since streaming doesn't always return token counts)
    yield {
      type: 'usage',
      inputTokens: Math.ceil(messages.map((m) => m.content).join('').length / 4),
      outputTokens: Math.ceil(totalContent.length / 4),
    };

    yield { type: 'done' };
  } catch (error: any) {
    yield {
      type: 'error',
      error: error.message || 'AI 服务请求失败',
    };
  }
}
