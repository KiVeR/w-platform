import { z } from 'zod'

export const contentTypeEnum = z.enum(['landing-page', 'rcs', 'sms'])

export const pageStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])

export const createContentSchema = z.object({
  type: contentTypeEnum,
  title: z
    .string({ required_error: 'Titre requis' })
    .min(1, 'Titre requis')
    .max(200, 'Titre trop long (max 200 caractères)'),
})

export const updateContentSchema = z.object({
  title: z
    .string()
    .min(1, 'Titre requis')
    .max(200, 'Titre trop long')
    .optional(),
  status: pageStatusEnum.optional(),
})

export const contentPaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: contentTypeEnum.optional(),
  status: pageStatusEnum.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Shared params schema for contentId
export const contentIdParamsSchema = z.object({
  contentId: z.coerce.number().int().positive(),
})

// Infer types
export type CreateContentInput = z.infer<typeof createContentSchema>
export type UpdateContentInput = z.infer<typeof updateContentSchema>
export type ContentPaginationInput = z.infer<typeof contentPaginationSchema>
export type ContentIdParams = z.infer<typeof contentIdParamsSchema>
