import type { RoleType } from '#shared/constants/roles'
import type { AIQuotaResponse } from '#shared/types/ai'
import { getAIGenerationService } from '../../../services/ai/generation.service'

/**
 * GET /api/v1/ai/quota
 *
 * Returns the user's AI generation quota information.
 */
export default defineEventHandler(async (event): Promise<AIQuotaResponse> => {
  // Require authentication
  const user = await requireAuth(event)

  // Get AI service
  const aiService = getAIGenerationService()

  // Get quota info
  const quota = await aiService.getQuota(user.id, user.role as RoleType)

  return { quota }
})
