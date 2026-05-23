import { z } from 'zod';
import { userSchema } from './user.js';

/* ---------- Requests ---------- */

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const registerRequestSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/, 'letters, numbers, dash, underscore only'),
  password: z.string().min(8).max(128),
  invitationToken: z.string().optional(),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});
export type RequestPasswordResetRequest = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  newPassword: z.string().min(8).max(128),
});
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(16),
});
export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>;

/* ---------- Responses ---------- */

export const authResponseSchema = z.object({
  user: userSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
