import type { ModelConfig } from '@open-arena/shared';
import type { ChatAdapter, StreamCallbacks } from './base.js';

/**
 * OpenAI-compatible chat adapter.
 *
 * Handles any provider that exposes a standard OpenAI /v1/chat/completions
 * SSE endpoint. This is the default adapter used when no more specific
 * adapter matches.
 */
export class OpenAIAdapter implements ChatAdapter {
  async streamChat(
    model: ModelConfig,
    messages: { role: string; content: string }[],
    { onChunk, onComplete, onReasoning }: StreamCallbacks,
    signal: AbortSignal,
  ): Promise<string> {
    const apiKey = process.env[model.apiKeyEnv];
    if (!apiKey) throw new Error(`API key not configured for ${model.name}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    if (model.baseUrl.includes('g4f.space')) {
      headers['HTTP-Referer'] = 'http://localhost:5173';
      headers['X-Title'] = 'Open Arena';
    }

    const body: Record<string, unknown> = {
      model: model.modelId,
      messages,
      stream: true,
      max_tokens: 8192,
    };

    if (model.baseUrl.includes('nvidia.com')) {
      body.temperature = 0.7;
      body.top_p = 1;
    }

    const response = await fetch(`${model.baseUrl}${model.endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API error: ${response.status} - ${err}`);
    }

    if (!response.body) throw new Error('API response body is null');

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
          const delta = parsed.choices?.[0]?.delta;
          const reasoningContent = delta?.reasoning_content;
          if (reasoningContent) {
            onReasoning?.(reasoningContent);
          }
          const content = delta?.content;
          if (content) {
            fullContent += content;
            onChunk(content);
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
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model.modelId,
          max_tokens: 50,
          messages: [
            {
              role: 'system',
              content:
                'Generate a short title (5 words max) for this conversation. Return ONLY the title, nothing else.',
            },
            { role: 'user', content },
          ],
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.slice(0, 100) ?? null;
    } catch {
      return null;
    }
  }
}
