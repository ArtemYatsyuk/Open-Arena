import { describe, it, expect } from 'vitest';
import {
  configSchema,
  loginRequestSchema,
  messageRoleSchema,
  sseEventSchema,
  userRoleSchema,
} from './index.js';

describe('shared schemas', () => {
  it('rejects a config that smuggles a secret into apiKeyEnv', () => {
    const bad = {
      models: [
        {
          id: 'qwen',
          name: 'Qwen',
          baseUrl: 'https://llm.example.com',
          endpoint: '/v1/chat/completions',
          modelId: 'qwen/qwen3-max',
          apiKeyEnv: 'https://example.com/?token=abc',
          streaming: true,
          contextWindow: 32768,
        },
      ],
      defaultModelId: 'qwen',
      app: {},
      webSearch: {},
    };
    expect(() => configSchema.parse(bad)).toThrow();
  });

  it('accepts a config that names a proper env var', () => {
    const good = {
      models: [
        {
          id: 'qwen',
          name: 'Qwen',
          baseUrl: 'https://llm.example.com',
          endpoint: '/v1/chat/completions',
          modelId: 'qwen/qwen3-max',
          apiKeyEnv: 'ATXP_API_KEY',
          streaming: true,
          contextWindow: 32768,
        },
      ],
      defaultModelId: 'qwen',
      app: {},
      webSearch: {},
    };
    expect(configSchema.parse(good).models[0]?.apiKeyEnv).toBe('ATXP_API_KEY');
  });

  it('parses a valid login request', () => {
    expect(loginRequestSchema.parse({ email: 'a@b.co', password: 'hunter22' })).toEqual({
      email: 'a@b.co',
      password: 'hunter22',
    });
  });

  it('enumerates message and user roles', () => {
    expect(messageRoleSchema.options).toEqual(['USER', 'ASSISTANT', 'SYSTEM', 'TOOL']);
    expect(userRoleSchema.options).toEqual(['USER', 'ADMIN']);
  });

  it('discriminates SSE events by type', () => {
    expect(sseEventSchema.parse({ type: 'chunk', delta: 'hi' })).toMatchObject({ type: 'chunk' });
    expect(() => sseEventSchema.parse({ type: 'bogus' })).toThrow();
  });
});
