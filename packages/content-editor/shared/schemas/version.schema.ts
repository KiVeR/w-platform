import { z } from 'zod'

export const versionListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const restoreVersionSchema = z.object({
  fromVersionId: z.number().int().positive({ message: 'ID de version requis' }),
  comment: z.string().max(500).optional(),
})

// Infer types
export type VersionListQueryInput = z.infer<typeof versionListQuerySchema>
export type RestoreVersionInput = z.infer<typeof restoreVersionSchema>
