import { z } from 'zod';
import { cuidSchema, isoDateSchema } from './common.js';

export const folderSchema = z.object({
  id: cuidSchema,
  userId: cuidSchema,
  name: z.string().min(1).max(64),
  icon: z.string().default('folder'),
  sortOrder: z.number().int().nonnegative(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});
export type Folder = z.infer<typeof folderSchema>;

export const createFolderSchema = z.object({
  name: z.string().min(1).max(64),
  icon: z.string().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});
export type CreateFolderRequest = z.infer<typeof createFolderSchema>;
