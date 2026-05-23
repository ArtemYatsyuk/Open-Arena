import type { ModelConfig } from '@open-arena/shared';

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onReasoning?: (chunk: string) => void;
}

export interface ChatAdapter {
  streamChat(
    model: ModelConfig,
    messages: { role: string; content: string }[],
    callbacks: StreamCallbacks,
    signal: AbortSignal,
  ): Promise<string>;

  generateTitle(model: ModelConfig, content: string): Promise<string | null>;
}
