import { z } from 'zod';

/**
 * Schema for the user-managed config.json file at the repo / install root.
 * Validated at backend startup and on every admin write.
 */
export const modelConfigSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(128),
  baseUrl: z.string().url(),
  endpoint: z.string().startsWith('/'),
  modelId: z.string().min(1),
  /** Name of the env var holding the API key. MUST NOT contain the key itself. */
  apiKeyEnv: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'apiKeyEnv must be an UPPER_SNAKE_CASE env var name, not a secret'),
  streaming: z.boolean().default(true),
  contextWindow: z.number().int().positive(),
  description: z.string().default(''),
  image: z.string().optional(),
  /** Whether this model supports image inputs. */
  supportsVision: z.boolean().default(false),
  /** Optional pricing for usage analytics (per 1M tokens, USD). */
  pricing: z
    .object({
      inputPer1M: z.number().nonnegative(),
      outputPer1M: z.number().nonnegative(),
    })
    .optional(),
});
export type ModelConfig = z.infer<typeof modelConfigSchema>;

export const appConfigSchema = z.object({
  name: z.string().min(1).max(64).default('Open Arena'),
  logoUrl: z.string().default('/logo.svg'),
  allowRegistration: z.boolean().default(true),
  maxConversationsPerUser: z.number().int().min(0).default(200),
});
export type AppConfig = z.infer<typeof appConfigSchema>;

export const webSearchConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(['searxng']).default('searxng'),
  searxngUrl: z.string().url().optional(),
});
export type WebSearchConfig = z.infer<typeof webSearchConfigSchema>;

export const configSchema = z.object({
  models: z.array(modelConfigSchema).min(1),
  defaultModelId: z.string().min(1),
  app: appConfigSchema,
  webSearch: webSearchConfigSchema,
});
export type Config = z.infer<typeof configSchema>;
