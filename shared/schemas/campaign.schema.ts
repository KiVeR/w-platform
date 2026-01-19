import { z } from 'zod'

export const contentTypeEnum = z.enum(['landing-page', 'rcs', 'sms'])
export const campaignStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'])

export const createCampaignSchema = z.object({
  title: z
    .string({ required_error: 'Titre requis' })
    .min(1, 'Titre requis')
    .max(200, 'Titre trop long (max 200 caractères)'),
  description: z
    .string()
    .max(1000, 'Description trop longue (max 1000 caractères)')
    .optional(),
  enabledContentTypes: z
    .array(contentTypeEnum)
    .min(1, 'Sélectionnez au moins un type de contenu'),
})

export const updateCampaignSchema = z.object({
  title: z
    .string()
    .min(1, 'Titre requis')
    .max(200, 'Titre trop long')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description trop longue')
    .nullable()
    .optional(),
  status: campaignStatusEnum.optional(),
  enabledContentTypes: z
    .array(contentTypeEnum)
    .min(1, 'Sélectionnez au moins un type de contenu')
    .optional(),
})

export const campaignPaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: campaignStatusEnum.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Infer types
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>
export type CampaignPaginationInput = z.infer<typeof campaignPaginationSchema>
