import { z } from 'zod';
import { cuidSchema, isoDateSchema } from './common.js';

export const tagSchema = z.object({
  id: cuidSchema,
  name: z.string().min(1).max(32),
  color: z.string().default('#6C4FF6'),
  createdAt: isoDateSchema,
});
export type Tag = z.infer<typeof tagSchema>;

export const createTagSchema = z.object({
  name: z.string().min(1).max(32),
  color: z.string().optional(),
});
export type CreateTagRequest = z.infer<typeof createTagSchema>;
