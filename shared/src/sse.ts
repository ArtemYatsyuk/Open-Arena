import { z } from 'zod';
import { cuidSchema } from './common.js';
import { messageAlternativeSchema, webSearchSourceSchema } from './message.js';

/**
 * Discriminated union of all events emitted by the chat SSE stream.
 *
 * Both backend and frontend must use this type to encode and decode the
 * stream. New event types belong here first, implementations second.
 */
export const sseChunkEventSchema = z.object({
  type: z.literal('chunk'),
  delta: z.string(),
});

export const sseReasoningEventSchema = z.object({
  type: z.literal('reasoning'),
  delta: z.string(),
});

export const sseWebSearchEventSchema = z.object({
  type: z.literal('websearch'),
  query: z.string(),
  sources: z.array(webSearchSourceSchema),
});

export const sseConversationEventSchema = z.object({
  type: z.literal('conversation'),
  conversationId: cuidSchema,
  title: z.string(),
});

export const sseAlternativeEventSchema = z.object({
  type: z.literal('alternative'),
  messageId: cuidSchema,
  alternative: messageAlternativeSchema,
});

export const sseDoneEventSchema = z.object({
  type: z.literal('done'),
  messageId: cuidSchema,
});

export const sseErrorEventSchema = z.object({
  type: z.literal('error'),
  message: z.string(),
  code: z.string().optional(),
});

export const sseEventSchema = z.discriminatedUnion('type', [
  sseChunkEventSchema,
  sseReasoningEventSchema,
  sseWebSearchEventSchema,
  sseConversationEventSchema,
  sseAlternativeEventSchema,
  sseDoneEventSchema,
  sseErrorEventSchema,
]);

export type SseEvent = z.infer<typeof sseEventSchema>;
export type SseEventType = SseEvent['type'];

/** Helper: narrow an SSE event by its `type` discriminator. */
export function isSseEvent<T extends SseEventType>(
  ev: SseEvent,
  type: T,
): ev is Extract<SseEvent, { type: T }> {
  return ev.type === type;
}
