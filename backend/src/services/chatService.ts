import { getModelById } from '../config.js';
import { getAdapter } from './providers/index.js';
import type { StreamCallbacks } from './providers/base.js';

export type { StreamCallbacks };

export async function streamChat(
  modelId: string,
  messages: { role: string; content: string }[],
  callbacks: StreamCallbacks,
  signal: AbortSignal,
): Promise<string> {
  const model = getModelById(modelId);
  if (!model) throw new Error(`Model ${modelId} not found`);

  const adapter = getAdapter(model);
  return adapter.streamChat(model, messages, callbacks, signal);
}

export async function generateTitle(content: string, modelId: string): Promise<string> {
  const model = getModelById(modelId);
  if (!model) return content.slice(0, 50);

  const adapter = getAdapter(model);
  const title = await adapter.generateTitle(model, content);
  return title?.slice(0, 100) ?? content.slice(0, 50);
}
