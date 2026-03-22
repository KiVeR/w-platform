import type { RoleType } from '#shared/constants/roles'
import type {
  AIGenerationInput,
  AIQuotaInfo,
  AIStreamChunk,
} from '#shared/types/ai'
import type { AIDriver } from './drivers/types'
import { AI_QUOTA_BY_ROLE } from '#shared/types/ai'
import { DriverRegistry } from './drivers/registry'
import { validateImage } from './parsers/image.parser'

/**
 * AI Generation Service
 *
 * Orchestrates AI design generation with:
 * - Driver management (currently Claude, extensible to others)
 * - Quota tracking and enforcement
 * - Image validation and preparation
 */
export class AIGenerationService {
  private driver: AIDriver | null = null

  constructor() {
    this.initializeDriver()
  }

  /**
   * Initialize the AI driver from environment configuration
   *
   * Uses AI_PROVIDER env var to select provider (default: claude)
   * Falls back to first available provider if configured one fails
   */
  private initializeDriver(): void {
    // Use the registry to get the configured driver
    this.driver = DriverRegistry.getConfiguredDriver()

    if (this.driver) {
      // eslint-disable-next-line no-console
      console.log(`[AI] Initialized ${this.driver.name} driver with model ${this.driver.model}`)
    }
    else {
      console.warn('[AI] No AI provider configured. Set AI_PROVIDER and corresponding API key.')
      console.warn('[AI] Supported providers: claude, openai, groq, mistral, together, ollama')
    }
  }

  /**
   * Check if AI generation is available
   */
  isAvailable(): boolean {
    return this.driver !== null && this.driver.isConfigured()
  }

  /**
   * Get the current driver info
   */
  getDriverInfo(): { name: string, model: string } | null {
    if (!this.driver)
      return null
    return {
      name: this.driver.name,
      model: this.driver.model,
    }
  }

  /**
   * Get list of configured providers and their models
   * (Ready for Phase 2: model selection in UI)
   */
  getConfiguredProviders() {
    return DriverRegistry.getConfiguredProviders()
  }

  /**
   * Stream design generation
   *
   * @param input - Generation input with prompt and optional image
   * @param userId - User ID for quota tracking
   * @param userRole - User role for quota limits
   */
  async* generate(
    input: AIGenerationInput,
    userId: number,
    userRole: RoleType,
  ): AsyncGenerator<AIStreamChunk> {
    if (!this.driver) {
      yield {
        type: 'error',
        content: 'AI generation is not configured. Please contact administrator.',
        code: 'GENERATION_FAILED',
      }
      return
    }

    const quota = await this.getQuota(userId, userRole)
    if (!quota.canGenerate) {
      yield {
        type: 'error',
        content: `You have reached your monthly quota (${quota.limit} generations). Resets on ${quota.resetsAt.toLocaleDateString()}.`,
        code: 'QUOTA_EXCEEDED',
      }
      return
    }

    if (input.image) {
      const validation = validateImage(input.image.data, input.image.mimeType)
      if (!validation.valid) {
        yield {
          type: 'error',
          content: validation.error || 'Invalid image',
          code: 'INVALID_IMAGE',
        }
        return
      }
      input.image = validation.image
    }

    // Optimistic: track usage before generation, refund if no design produced
    await this.incrementUsage(userId)

    let hasDesign = false
    for await (const chunk of this.driver.streamDesign(input)) {
      if (chunk.type === 'design') {
        hasDesign = true
      }
      yield chunk
    }

    if (!hasDesign) {
      console.warn(`[AI] Generation for user ${userId} did not produce a design, refunding quota`)
      await this.decrementUsage(userId)
    }
  }

  /**
   * Get user quota information
   */
  async getQuota(userId: number, userRole: RoleType): Promise<AIQuotaInfo> {
    const limit = AI_QUOTA_BY_ROLE[userRole]
    const periodKey = this.getCurrentPeriodKey()

    const usage = await this.getUsage(userId, periodKey)
    const now = new Date()
    const resetsAt = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    return {
      remaining: Math.max(0, limit - usage),
      limit,
      resetsAt,
      canGenerate: limit > 0 && usage < limit,
    }
  }

  /**
   * Get current period key (YYYY-MM format)
   */
  private getCurrentPeriodKey(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  /**
   * Get usage count for a user in a period
   */
  private async getUsage(userId: number, periodKey: string): Promise<number> {
    try {
      const record = await prisma.aIUsage.findUnique({
        where: {
          userId_periodKey: {
            userId,
            periodKey,
          },
        },
      })
      return record?.count ?? 0
    }
    catch (error) {
      // Table might not exist yet in development
      console.warn('[AI] Failed to get usage:', error)
      return 0
    }
  }

  /**
   * Increment usage count for a user
   */
  private async incrementUsage(userId: number): Promise<void> {
    const periodKey = this.getCurrentPeriodKey()

    try {
      await prisma.aIUsage.upsert({
        where: {
          userId_periodKey: {
            userId,
            periodKey,
          },
        },
        create: {
          userId,
          periodKey,
          count: 1,
          lastGeneratedAt: new Date(),
        },
        update: {
          count: { increment: 1 },
          lastGeneratedAt: new Date(),
        },
      })
    }
    catch (error) {
      // Log but don't fail the generation
      console.error('[AI] Failed to increment usage:', error)
    }
  }

  /**
   * Decrement usage count for a user (refund on failed generation)
   */
  private async decrementUsage(userId: number): Promise<void> {
    const periodKey = this.getCurrentPeriodKey()

    try {
      await prisma.aIUsage.update({
        where: {
          userId_periodKey: {
            userId,
            periodKey,
          },
        },
        data: {
          count: { decrement: 1 },
        },
      })
    }
    catch (error) {
      console.error('[AI] Failed to decrement usage:', error)
    }
  }
}

// Singleton instance
let serviceInstance: AIGenerationService | null = null

/**
 * Get or create the AI generation service instance
 */
export function getAIGenerationService(): AIGenerationService {
  if (!serviceInstance) {
    serviceInstance = new AIGenerationService()
  }
  return serviceInstance
}
