import { z } from 'zod';
import { cuidSchema, isoDateSchema } from './common.js';

export const messageRoleSchema = z.enum(['USER', 'ASSISTANT', 'SYSTEM', 'TOOL']);
export type MessageRole = z.infer<typeof messageRoleSchema>;

/** A single citation surfaced from web search. */
export const webSearchSourceSchema = z.object({
  index: z.number().int().min(1),
  title: z.string(),
  url: z.string().url(),
  snippet: z.string().optional(),
});
export type WebSearchSource = z.infer<typeof webSearchSourceSchema>;

/**
 * A regenerated alternative for an assistant message.
 * Stored as a JSON array on the canonical message row.
 */
export const messageAlternativeSchema = z.object({
  id: z.string(),
  content: z.string(),
  reasoning: z.string().nullable().optional(),
  webSearchSources: z.array(webSearchSourceSchema).nullable().optional(),
  createdAt: isoDateSchema,
});
export type MessageAlternative = z.infer<typeof messageAlternativeSchema>;

export const messageSchema = z.object({
  id: cuidSchema,
  conversationId: cuidSchema,
  role: messageRoleSchema,
  content: z.string(),
  reasoning: z.string().nullable().optional(),
  webSearchSources: z.array(webSearchSourceSchema).nullable().optional(),
  alternatives: z.array(messageAlternativeSchema).nullable().optional(),
  tokenCount: z.number().int().nullable().optional(),
  createdAt: isoDateSchema,
});
export type Message = z.infer<typeof messageSchema>;
