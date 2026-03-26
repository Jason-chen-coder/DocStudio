'use client';

import { useState, useCallback, useRef } from 'react';
import {
  streamCompletion,
  type AiCompletionRequest,
  type AiCommand,
} from '@/services/ai-service';

interface UseAiCompletionReturn {
  isStreaming: boolean;
  result: string;
  error: string | null;
  command: AiCommand | null;
  run: (dto: AiCompletionRequest) => void;
  cancel: () => void;
  retry: () => void;
  reset: () => void;
}

export function useAiCompletion(): UseAiCompletionReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [command, setCommand] = useState<AiCommand | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastDtoRef = useRef<AiCompletionRequest | null>(null);

  const run = useCallback(async (dto: AiCompletionRequest) => {
    // Cancel any ongoing stream
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    lastDtoRef.current = dto;

    setIsStreaming(true);
    setResult('');
    setError(null);
    setCommand(dto.command);

    try {
      for await (const chunk of streamCompletion(dto, controller.signal)) {
        if (controller.signal.aborted) break;

        switch (chunk.type) {
          case 'text':
            setResult((prev) => prev + (chunk.content || ''));
            break;
          case 'error':
            setError(chunk.error || 'AI 请求失败');
            break;
          case 'done':
            break;
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'AI 请求失败');
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const retry = useCallback(() => {
    if (lastDtoRef.current) {
      run(lastDtoRef.current);
    }
  }, [run]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setResult('');
    setError(null);
    setCommand(null);
    lastDtoRef.current = null;
  }, []);

  return { isStreaming, result, error, command, run, cancel, retry, reset };
}
