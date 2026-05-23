import { z } from 'zod';
import { cuidSchema, isoDateSchema } from './common.js';
import { messageSchema } from './message.js';

export const conversationSchema = z.object({
  id: cuidSchema,
  userId: cuidSchema,
  modelId: z.string().min(1),
  title: z.string(),
  isStarred: z.boolean(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type Conversation = z.infer<typeof conversationSchema>;

export const conversationWithMessagesSchema = conversationSchema.extend({
  messages: z.array(messageSchema),
});
export type ConversationWithMessages = z.infer<typeof conversationWithMessagesSchema>;

/* ---------- Requests ---------- */

export const createConversationSchema = z.object({
  modelId: z.string().min(1),
  title: z.string().max(200).optional(),
});
export type CreateConversationRequest = z.infer<typeof createConversationSchema>;

export const updateConversationSchema = z.object({
  title: z.string().max(200).optional(),
  isStarred: z.boolean().optional(),
});
export type UpdateConversationRequest = z.infer<typeof updateConversationSchema>;

export const sendChatMessageSchema = z.object({
  conversationId: cuidSchema.optional(),
  modelId: z.string().min(1),
  content: z.string().min(1),
  reasoning: z.boolean().optional(),
  webSearch: z.boolean().optional(),
  regenerateMessageId: cuidSchema.optional(),
});
export type SendChatMessageRequest = z.infer<typeof sendChatMessageSchema>;
