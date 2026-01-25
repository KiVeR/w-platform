import { z } from 'zod'

// =============================================================================
// IMAGE INPUT
// =============================================================================

export const aiImageInputSchema = z.object({
  data: z.string().min(1, 'Image data is required'),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/gif', 'image/webp']),
})

// =============================================================================
// CHAT MESSAGE
// =============================================================================

export const aiChatMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  image: aiImageInputSchema.optional(),
  design: z.unknown().optional(),
  createdAt: z.coerce.date(),
})

// =============================================================================
// GENERATION CONTEXT
// =============================================================================

export const aiGenerationContextSchema = z.object({
  currentWidgets: z.number().int().min(0).optional(),
  contentType: z.enum(['landing-page', 'rcs', 'sms']).optional(),
  currentDesign: z.unknown().optional(),
})

// =============================================================================
// CHAT REQUEST
// =============================================================================

export const aiChatRequestSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt is required')
    .max(10000, 'Prompt is too long (max 10000 characters)'),
  image: aiImageInputSchema.optional(),
  conversationHistory: z.array(aiChatMessageSchema).max(20).optional(),
  context: aiGenerationContextSchema.optional(),
})

// =============================================================================
// STREAM CHUNKS
// =============================================================================

export const aiStreamTokenChunkSchema = z.object({
  type: z.literal('token'),
  content: z.string(),
})

export const aiStreamDesignChunkSchema = z.object({
  type: z.literal('design'),
  content: z.unknown(),
})

export const aiStreamErrorChunkSchema = z.object({
  type: z.literal('error'),
  content: z.string(),
  code: z.enum(['RATE_LIMIT', 'INVALID_IMAGE', 'GENERATION_FAILED', 'QUOTA_EXCEEDED']).optional(),
})

export const aiTokenUsageSchema = z.object({
  promptTokens: z.number().int().min(0),
  completionTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
})

export const aiStreamDoneChunkSchema = z.object({
  type: z.literal('done'),
  usage: aiTokenUsageSchema,
})

export const aiStreamChunkSchema = z.discriminatedUnion('type', [
  aiStreamTokenChunkSchema,
  aiStreamDesignChunkSchema,
  aiStreamErrorChunkSchema,
  aiStreamDoneChunkSchema,
])

// =============================================================================
// QUOTA
// =============================================================================

export const aiQuotaInfoSchema = z.object({
  remaining: z.number().int().min(0),
  limit: z.number().int().min(0),
  resetsAt: z.coerce.date(),
  canGenerate: z.boolean(),
})

export const aiQuotaResponseSchema = z.object({
  quota: aiQuotaInfoSchema,
})

// =============================================================================
// INFERRED TYPES
// =============================================================================

export type AIImageInputSchema = z.infer<typeof aiImageInputSchema>
export type AIChatMessageSchema = z.infer<typeof aiChatMessageSchema>
export type AIChatRequestSchema = z.infer<typeof aiChatRequestSchema>
export type AIStreamChunkSchema = z.infer<typeof aiStreamChunkSchema>
export type AIQuotaInfoSchema = z.infer<typeof aiQuotaInfoSchema>
