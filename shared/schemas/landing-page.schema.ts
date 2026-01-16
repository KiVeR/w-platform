import { z } from 'zod'

export const createLandingPageSchema = z.object({
  title: z
    .string({ required_error: 'Titre requis' })
    .min(1, 'Titre requis')
    .max(200, 'Titre trop long'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug invalide (minuscules, chiffres, tirets)')
    .optional(),
})

export const updateLandingPageSchema = z.object({
  title: z
    .string()
    .min(1, 'Titre requis')
    .max(200, 'Titre trop long')
    .optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug invalide')
    .optional(),
  status: z
    .enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
    .optional(),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Infer types
export type CreateLandingPageInput = z.infer<typeof createLandingPageSchema>
export type UpdateLandingPageInput = z.infer<typeof updateLandingPageSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
