import type {
  AIDriver,
  KnownProvider,
  ModelInfo,
  OpenAICompatibleDriverConfig,
  ProviderInfo,
} from './types'
import process from 'node:process'
import { getProviderPreset, PROVIDER_PRESETS } from '../providers/presets'
import { createClaudeDriver } from './claude.driver'
import { createOpenAICompatibleDriver } from './openai-compatible.driver'

/**
 * Configured provider information for API responses
 */
export interface ConfiguredProvider {
  id: KnownProvider
  name: string
  models: ModelInfo[]
  defaultModel: string
  supportsVision: boolean
}

/**
 * Driver Registry
 *
 * Central factory for creating and managing AI drivers.
 * Detects configured providers from environment variables
 * and provides methods for driver creation.
 */
export class DriverRegistry {
  /**
   * Create a driver for a known provider
   */
  static createForProvider(
    provider: KnownProvider,
    overrides?: Partial<OpenAICompatibleDriverConfig>,
  ): AIDriver | null {
    // Special case for Claude (uses Anthropic SDK)
    if (provider === 'claude') {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey)
        return null

      try {
        return createClaudeDriver(apiKey, overrides?.model as any)
      }
      catch (error) {
        console.error('[DriverRegistry] Failed to create Claude driver:', error)
        return null
      }
    }

    // Get preset for OpenAI-compatible providers
    const preset = getProviderPreset(provider)
    if (!preset)
      return null

    // Get API key from environment
    const apiKey = process.env[preset.envKeyName]

    // Ollama doesn't require an API key
    if (!apiKey && provider !== 'ollama')
      return null

    // For Ollama, check if custom host is set
    let baseURL = preset.baseURL
    if (provider === 'ollama' && process.env.OLLAMA_HOST) {
      baseURL = process.env.OLLAMA_HOST
      if (!baseURL.endsWith('/v1')) {
        baseURL = `${baseURL}/v1`
      }
    }

    const config: OpenAICompatibleDriverConfig = {
      apiKey: apiKey || 'ollama', // Ollama uses dummy key
      model: overrides?.model || preset.defaultModel,
      baseURL,
      providerName: preset.name,
      supportsVision: overrides?.supportsVision ?? preset.supportsVision,
      maxTokens: overrides?.maxTokens,
      temperature: overrides?.temperature,
      jsonMode: preset.supportsJsonMode,
      isOllama: preset.isOllama,
    }

    try {
      return createOpenAICompatibleDriver(config)
    }
    catch (error) {
      console.error(`[DriverRegistry] Failed to create ${provider} driver:`, error)
      return null
    }
  }

  /**
   * Create a driver from explicit configuration
   */
  static createFromConfig(config: OpenAICompatibleDriverConfig): AIDriver {
    return createOpenAICompatibleDriver(config)
  }

  /**
   * Get the driver for the configured provider (from AI_PROVIDER env var)
   */
  static getConfiguredDriver(): AIDriver | null {
    const provider = (process.env.AI_PROVIDER || 'claude') as KnownProvider
    const model = process.env.AI_MODEL

    const driver = this.createForProvider(provider, model ? { model } : undefined)

    if (driver) {
      return driver
    }

    // Fallback to any available driver
    console.warn(`[DriverRegistry] Provider "${provider}" not configured, trying fallback`)
    return this.getBestAvailable()
  }

  /**
   * Get the best available driver based on environment
   */
  static getBestAvailable(): AIDriver | null {
    // Priority order: Claude first, then fast providers
    const providers: KnownProvider[] = [
      'claude',
      'groq',
      'openai',
      'mistral',
      'together',
      'ollama',
    ]

    for (const provider of providers) {
      const driver = this.createForProvider(provider)
      if (driver) {
        console.log(`[DriverRegistry] Using fallback provider: ${provider}`)
        return driver
      }
    }

    return null
  }

  /**
   * Get all configured drivers
   */
  static getAllConfigured(): AIDriver[] {
    const drivers: AIDriver[] = []
    const providers: KnownProvider[] = [
      'claude',
      'openai',
      'groq',
      'together',
      'mistral',
      'ollama',
    ]

    for (const provider of providers) {
      const driver = this.createForProvider(provider)
      if (driver) {
        drivers.push(driver)
      }
    }

    return drivers
  }

  /**
   * Get list of configured providers with their models
   * (Ready for Phase 2: /api/v1/ai/models endpoint)
   */
  static getConfiguredProviders(): ConfiguredProvider[] {
    const configured: ConfiguredProvider[] = []

    // Check Claude
    if (process.env.ANTHROPIC_API_KEY) {
      configured.push({
        id: 'claude',
        name: 'Claude (Anthropic)',
        defaultModel: 'claude-sonnet-4-5-20250929',
        supportsVision: true,
        models: [
          { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', vision: true, contextLength: 200000 },
          { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', vision: true, contextLength: 200000 },
          { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', vision: true, contextLength: 200000 },
          { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', vision: true, contextLength: 200000 },
          { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', vision: true, contextLength: 200000 },
        ],
      })
    }

    // Check OpenAI-compatible providers
    for (const [providerId, preset] of Object.entries(PROVIDER_PRESETS)) {
      const apiKey = process.env[preset.envKeyName]

      // Ollama is available if host is set (no key needed)
      const isOllama = providerId === 'ollama'
      const isAvailable = apiKey || (isOllama && process.env.OLLAMA_HOST)

      if (isAvailable) {
        configured.push({
          id: providerId as KnownProvider,
          name: preset.name,
          defaultModel: preset.defaultModel,
          supportsVision: preset.supportsVision,
          models: preset.models,
        })
      }
    }

    return configured
  }

  /**
   * Check if a specific provider is configured
   */
  static isProviderConfigured(provider: KnownProvider): boolean {
    if (provider === 'claude') {
      return !!process.env.ANTHROPIC_API_KEY
    }

    if (provider === 'ollama') {
      return !!process.env.OLLAMA_HOST
    }

    const preset = getProviderPreset(provider)
    return preset ? !!process.env[preset.envKeyName] : false
  }
}
