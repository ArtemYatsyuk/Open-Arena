import { z } from 'zod';
import { cuidSchema, isoDateSchema } from './common.js';

export const auditLogSchema = z.object({
  id: cuidSchema,
  actorId: cuidSchema.nullable().optional(),
  action: z.string(),
  targetType: z.string().nullable().optional(),
  targetId: z.string().nullable().optional(),
  details: z.string().nullable().optional(),
  createdAt: isoDateSchema,
});
export type AuditLog = z.infer<typeof auditLogSchema>;
