import { z } from 'zod';

/** Branded ID type for compile-time safety. */
export type Brand<T, B> = T & { readonly __brand: B };

export const cuidSchema = z.string().min(1).max(64);

export const isoDateSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'invalid ISO date' });

/** Generic API error envelope returned by the backend. */
export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/** Pagination response wrapper. */
export const paginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(200),
  total: z.number().int().min(0),
});
export type Pagination = z.infer<typeof paginationSchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    pagination: paginationSchema,
  });
}
