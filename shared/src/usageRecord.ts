import { z } from 'zod';
import { cuidSchema, isoDateSchema } from './common.js';

export const usageRecordSchema = z.object({
  id: cuidSchema,
  userId: cuidSchema,
  modelId: z.string(),
  tokensIn: z.number().int().nonnegative(),
  tokensOut: z.number().int().nonnegative(),
  costEstimate: z.number().nonnegative().nullable().optional(),
  latencyMs: z.number().int().nonnegative().nullable().optional(),
  messageId: cuidSchema,
  createdAt: isoDateSchema,
});
export type UsageRecord = z.infer<typeof usageRecordSchema>;
