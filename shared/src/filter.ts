import { z } from 'zod';
import { cuidSchema, isoDateSchema } from './common.js';

export const filterValveValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(filterValveValueSchema),
    z.record(filterValveValueSchema),
  ]),
);

export const filterSchema = z.object({
  id: cuidSchema,
  name: z.string().min(1).max(128),
  description: z.string().nullable().optional(),
  code: z.string(),
  authorId: cuidSchema.nullable().optional(),
  isGlobal: z.boolean(),
  isActive: z.boolean(),
  priority: z.number().int(),
  valves: z.record(filterValveValueSchema).nullable().optional(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type Filter = z.infer<typeof filterSchema>;

export const createFilterSchema = filterSchema
  .omit({ id: true, authorId: true, createdAt: true, updatedAt: true })
  .partial({ isGlobal: true, isActive: true, priority: true, valves: true, description: true });
export type CreateFilterRequest = z.infer<typeof createFilterSchema>;

export const updateFilterSchema = createFilterSchema.partial();
export type UpdateFilterRequest = z.infer<typeof updateFilterSchema>;
