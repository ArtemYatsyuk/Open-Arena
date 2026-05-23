import { z } from 'zod';
import { cuidSchema, isoDateSchema } from './common.js';
import { userRoleSchema } from './user.js';

export const invitationSchema = z.object({
  id: cuidSchema,
  email: z.string().email().nullable().optional(),
  role: userRoleSchema,
  token: z.string().min(16),
  createdBy: cuidSchema,
  expiresAt: isoDateSchema,
  usedAt: isoDateSchema.nullable().optional(),
  createdAt: isoDateSchema,
});
export type Invitation = z.infer<typeof invitationSchema>;

export const createInvitationSchema = z.object({
  email: z.string().email().optional(),
  role: userRoleSchema.default('USER'),
  expiresInDays: z.number().int().min(1).max(90).default(7),
});
export type CreateInvitationRequest = z.infer<typeof createInvitationSchema>;
