import { z } from 'zod';
import { cuidSchema, isoDateSchema } from './common.js';

export const userRoleSchema = z.enum(['USER', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
  id: cuidSchema,
  email: z.string().email(),
  username: z.string().min(1).max(64),
  role: userRoleSchema,
  isBanned: z.boolean(),
  banReason: z.string().nullable().optional(),
  avatarColor: z.string().nullable().optional(),
  createdAt: isoDateSchema,
  lastActiveAt: isoDateSchema.nullable().optional(),
});
export type User = z.infer<typeof userSchema>;

/** Safe subset of user fields exposed to non-admin clients. */
export const publicUserSchema = userSchema.pick({
  id: true,
  username: true,
  avatarColor: true,
});
export type PublicUser = z.infer<typeof publicUserSchema>;
