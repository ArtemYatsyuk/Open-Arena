/**
 * Typed SSE client for consuming the Open Arena chat stream.
 *
 * Parses each `data: {...}\n\n` line into the shared SseEvent union and
 * dispatches it via a callback. Replaces all ad-hoc SSE parsing code.
 */
import type { SseEvent } from '@open-arena/shared';
import { sseEventSchema } from '@open-arena/shared';

export type SseOptions = {
  signal?: AbortSignal;
  onEvent: (event: SseEvent) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
};

/**
 * Connect to an SSE endpoint and stream parsed events.
 *
 * Returns a promise that resolves when the stream completes (receives
 * a `done` event) or rejects on network/parse errors.
 */
export async function connectSse(
  url: string,
  { signal, onEvent, onError, onClose }: SseOptions,
): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`SSE connection failed (${response.status}): ${text}`);
  }

  if (!response.body) {
    throw new Error('SSE response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const lines = part.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;

          try {
            const parsed = JSON.parse(raw);
            const result = sseEventSchema.safeParse(parsed);
            if (result.success) {
              onEvent(result.data);
              if (result.data.type === 'done') {
                onClose?.();
                return;
              }
            } else {
              onError?.(new Error(`SSE parse error: ${result.error.message}`));
            }
          } catch (e) {
            onError?.(new Error(`SSE JSON parse error: ${e}`));
          }
        }
      }
    }
    onClose?.();
  } catch (e: any) {
    if (e.name === 'AbortError') {
      onClose?.();
      return;
    }
    onError?.(e);
    throw e;
  }
}

/**
 * Create a POST request body that sends a chat message and returns the
 * endpoint path for use with `connectSse`.
 */
export function chatSsePath(): string {
  return '/api/chat';
}

export function buildChatBody(params: {
  conversationId?: string;
  content: string;
  modelId: string;
  webSearch?: boolean;
  reasoning?: boolean;
  regenerateMessageId?: string;
}): string {
  return JSON.stringify(params);
}
