import { getToken } from '@/lib/api';
import { apiRequest } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ── Types ──

export type AiCommand = 'continue' | 'polish' | 'translate' | 'summary' | 'custom' | 'autocomplete' | 'longer' | 'shorter';

export interface AiCompletionRequest {
  command: AiCommand;
  text: string;
  context?: string;
  customPrompt?: string;
  language?: string;
  deepThink?: boolean;
}

export interface AiStreamChunk {
  type: 'text' | 'usage' | 'done' | 'error';
  content?: string;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}

export interface AiUsageInfo {
  todayUsed: number;
  dailyLimit: number;
  totalUsed: number;
}

export interface AiConfigField<T = string> {
  value: T;
  source: 'custom' | 'default';
}

export interface AiConfigWithSource {
  provider: AiConfigField;
  apiKey: AiConfigField & { maskedValue: string };
  baseUrl: AiConfigField;
  model: AiConfigField;
  dailyLimit: AiConfigField<number>;
}

export interface AiAdminUsage {
  todayRequests: number;
  todayTokens: number;
}

// ── Stream Consumer ──

export async function* streamCompletion(
  dto: AiCompletionRequest,
  signal?: AbortSignal,
): AsyncGenerator<AiStreamChunk> {
  const token = getToken();
  const response = await fetch(`${API_URL}/ai/completion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(dto),
    signal,
  });

  if (!response.ok) {
    yield { type: 'error', error: `请求失败: HTTP ${response.status}` };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { type: 'error', error: '无法读取响应流' };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(trimmed.slice(6)) as AiStreamChunk;
          yield data;
        } catch {
          // skip malformed lines
        }
      }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      yield { type: 'error' as const, error: '网络连接中断' };
    }
  }
}

// ── Chat Types ──

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatRequest {
  documentId?: string;
  documentContent?: string;
  messages: AiChatMessage[];
}

// ── Chat Stream Consumer ──

export async function* streamChat(
  dto: AiChatRequest,
  signal?: AbortSignal,
): AsyncGenerator<AiStreamChunk> {
  const token = getToken();
  const response = await fetch(`${API_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(dto),
    signal,
  });

  if (!response.ok) {
    yield { type: 'error', error: `请求失败: HTTP ${response.status}` };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { type: 'error', error: '无法读取响应流' };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(trimmed.slice(6)) as AiStreamChunk;
          yield data;
        } catch {
          // skip malformed lines
        }
      }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      yield { type: 'error' as const, error: '网络连接中断' };
    }
  }
}

// ── REST API ──

export const aiService = {
  getUsage(): Promise<AiUsageInfo> {
    return apiRequest<AiUsageInfo>('/ai/usage');
  },

  getConfig(): Promise<AiConfigWithSource> {
    return apiRequest<AiConfigWithSource>('/ai/config');
  },

  updateConfig(data: Record<string, any>): Promise<AiConfigWithSource> {
    return apiRequest<AiConfigWithSource>('/ai/config', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  resetField(field: string): Promise<AiConfigWithSource> {
    return apiRequest<AiConfigWithSource>('/ai/config/reset', {
      method: 'POST',
      body: JSON.stringify({ field }),
    });
  },

  getAdminUsage(): Promise<AiAdminUsage> {
    return apiRequest<AiAdminUsage>('/ai/admin/usage');
  },
};

// ── Command Labels ──

export const AI_COMMAND_LABELS: Record<AiCommand, string> = {
  continue: '继续写',
  polish: '帮我润色',
  longer: '丰富内容',
  shorter: '精简内容',
  translate: '翻译为',
  summary: '生成摘要',
  custom: '自定义指令',
  autocomplete: '自动补全',
};
