import { z } from 'zod';
import { cuidSchema, isoDateSchema } from './common.js';

export const attachmentSchema = z.object({
  id: cuidSchema,
  conversationId: cuidSchema,
  messageId: cuidSchema.nullable().optional(),
  userId: cuidSchema,
  fileName: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  path: z.string(),
  sha256: z.string().nullable().optional(),
  createdAt: isoDateSchema,
});
export type Attachment = z.infer<typeof attachmentSchema>;

export const attachmentResponseSchema = z.object({
  id: cuidSchema,
  fileName: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  url: z.string(),
});
export type AttachmentResponse = z.infer<typeof attachmentResponseSchema>;
