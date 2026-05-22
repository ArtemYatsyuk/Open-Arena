import { getModelById } from '../config.js';
import { prisma } from '../index.js';

export async function streamChat(
  modelId: string,
  messages: { role: string; content: string }[],
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  signal: AbortSignal,
  onReasoning?: (chunk: string) => void
) {
  const model = getModelById(modelId);
  if (!model) throw new Error(`Model ${modelId} not found`);

  const apiKey = process.env[model.apiKeyEnv];
  if (!apiKey) throw new Error(`API key not configured for ${model.name}`);

  const isAnthropic = model.baseUrl.includes('anthropic');

  let fullContent = '';

  if (isAnthropic) {
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

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
        messages: userMessages.map(m => ({ role: m.role, content: m.content })),
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
        } catch {}
      }
    }
  } else {
    const isG4F = model.baseUrl.includes('g4f.space');
    const isNVIDIA = model.baseUrl.includes('nvidia.com');

    const response = await fetch(`${model.baseUrl}${model.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(isG4F && {
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Open Arena',
        }),
        ...(isNVIDIA && {
          'Accept': 'application/json',
        }),
      },
      body: JSON.stringify({
        model: model.modelId,
        messages,
        stream: true,
        max_tokens: 8192,
        ...(isNVIDIA && {
          temperature: 0.7,
          top_p: 1,
        }),
      }),
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
    let fullReasoning = '';

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
            fullReasoning += reasoningContent;
            onReasoning?.(reasoningContent);
          }
          const content = delta?.content;
          if (content) {
            fullContent += content;
            onChunk(content);
          }
        } catch (e) {
          console.error('SSE parse error:', e, 'line:', trimmed);
        }
      }
    }
  }

  onComplete();
  return fullContent;
}

export async function generateTitle(content: string, modelId: string): Promise<string> {
  const model = getModelById(modelId);
  if (!model) return content.slice(0, 50);

  const apiKey = process.env[model.apiKeyEnv];
  if (!apiKey) return content.slice(0, 50);

  const isAnthropic = model.baseUrl.includes('anthropic');

  try {
    if (isAnthropic) {
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
          system: 'Generate a short title (5 words max) for this conversation. Return ONLY the title, nothing else.',
          messages: [{ role: 'user', content }],
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        return data.content?.[0]?.text?.slice(0, 100) || content.slice(0, 50);
      }
    } else {
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
            { role: 'system', content: 'Generate a short title (5 words max) for this conversation. Return ONLY the title, nothing else.' },
            { role: 'user', content },
          ],
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.slice(0, 100) || content.slice(0, 50);
      }
    }
  } catch {}

  return content.slice(0, 50);
}
