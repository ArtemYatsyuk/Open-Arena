import type { ModelConfig } from '@open-arena/shared';
import type { ChatAdapter } from './base.js';
import { OpenAIAdapter } from './openai.js';
import { AnthropicAdapter } from './anthropic.js';

export type { ChatAdapter, StreamCallbacks } from './base.js';

/**
 * Provider registry. Maps detection predicates to adapter instances.
 * Add new providers by extending this array and creating the adapter class.
 */
const registry: Array<{
  detect: (model: ModelConfig) => boolean;
  adapter: ChatAdapter;
}> = [{ detect: (m) => m.baseUrl.includes('anthropic'), adapter: new AnthropicAdapter() }];

const defaultAdapter = new OpenAIAdapter();

/**
 * Return the appropriate chat adapter for the given model configuration.
 */
export function getAdapter(model: ModelConfig): ChatAdapter {
  const entry = registry.find((r) => r.detect(model));
  return entry?.adapter ?? defaultAdapter;
}
