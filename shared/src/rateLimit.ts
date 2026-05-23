import { z } from 'zod';
import { cuidSchema, isoDateSchema } from './common.js';

export const rateLimitPolicySchema = z.object({
  id: cuidSchema,
  name: z.string().min(1).max(64),
  scope: z.enum(['GLOBAL', 'ROLE', 'USER']),
  scopeId: z.string().nullable().optional(),
  requestsPerWindow: z.number().int().positive(),
  windowSec: z.number().int().positive(),
  monthlyTokenQuota: z.number().int().positive().nullable().optional(),
  active: z.boolean(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type RateLimitPolicy = z.infer<typeof rateLimitPolicySchema>;
