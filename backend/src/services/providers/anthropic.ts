import type { ModelConfig } from '@open-arena/shared';
import type { ChatAdapter, StreamCallbacks } from './base.js';

/**
 * Anthropic-compatible chat adapter.
 *
 * Implements the Anthropic Messages API streaming protocol.
 * Detected automatically for model configs whose `baseUrl` includes
 * 'anthropic'.
 */
export class AnthropicAdapter implements ChatAdapter {
  async streamChat(
    model: ModelConfig,
    messages: { role: string; content: string }[],
    { onChunk, onComplete, onReasoning }: StreamCallbacks,
    signal: AbortSignal,
  ): Promise<string> {
    const apiKey = process.env[model.apiKeyEnv];
    if (!apiKey) throw new Error(`API key not configured for ${model.name}`);

    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const response = await fetch(`${model.baseUrl}${model.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model.modelId,
        max_tokens: 8192,
        system: systemMessage?.content,
        messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${err}`);
    }

    if (!response.body) throw new Error('Anthropic response body is null');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_start' && parsed.content_block?.text) {
            fullContent += parsed.content_block.text;
            onChunk(parsed.content_block.text);
          }
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            fullContent += parsed.delta.text;
            onChunk(parsed.delta.text);
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    onComplete();
    return fullContent;
  }

  async generateTitle(model: ModelConfig, content: string): Promise<string | null> {
    const apiKey = process.env[model.apiKeyEnv];
    if (!apiKey) return null;

    try {
      const response = await fetch(`${model.baseUrl}${model.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model.modelId,
          max_tokens: 50,
          system:
            'Generate a short title (5 words max) for this conversation. Return ONLY the title, nothing else.',
          messages: [{ role: 'user', content }],
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.content?.[0]?.text?.slice(0, 100) ?? null;
    } catch {
      return null;
    }
  }
}
