import type {
  AIGenerationInput,
  AIStreamChunk,
} from '#shared/types/ai'

/**
 * AI Driver Interface
 *
 * All LLM providers must implement this interface to be used
 * as interchangeable drivers in the AI generation system.
 *
 * Current implementations:
 * - ClaudeDriver (Anthropic)
 *
 * Future implementations:
 * - OpenAIDriver (GPT-4)
 * - GeminiDriver (Google)
 */
export interface AIDriver {
  /** Driver name for identification */
  readonly name: string

  /** Model identifier being used */
  readonly model: string

  /**
   * Stream design generation from the LLM
   *
   * @param input - User prompt, image, and context
   * @yields StreamChunk - Token, design, error, or done events
   */
  streamDesign: (input: AIGenerationInput) => AsyncGenerator<AIStreamChunk>

  /**
   * Check if the driver is properly configured
   * (e.g., API key is present)
   */
  isConfigured: () => boolean
}

/**
 * Driver configuration options
 */
export interface AIDriverConfig {
  /** API key for the provider */
  apiKey?: string
  /** Model to use */
  model?: string
  /** Maximum tokens for completion */
  maxTokens?: number
  /** Temperature for generation (0-1) */
  temperature?: number
}

/**
 * Claude-specific configuration
 */
export interface ClaudeDriverConfig extends AIDriverConfig {
  apiKey: string
  model?: 'claude-opus-4-6' | 'claude-sonnet-4-5-20250929' | 'claude-sonnet-4-20250514' | 'claude-opus-4-20250514' | 'claude-haiku-4-5-20251001'
}

/**
 * OpenAI-compatible driver configuration
 * Works with OpenAI, Groq, Together AI, Mistral, Ollama, etc.
 */
export interface OpenAICompatibleDriverConfig extends AIDriverConfig {
  /** API key for authentication */
  apiKey: string
  /** Model identifier (e.g., 'gpt-4o', 'llama-3.1-70b-versatile') */
  model: string
  /** Base URL for the API (defaults to OpenAI) */
  baseURL?: string
  /** Custom headers for the request */
  headers?: Record<string, string>
  /** Provider name for logging/identification */
  providerName?: string
  /** Whether the model supports vision/images */
  supportsVision?: boolean
  /** Image detail level for vision models */
  imageDetail?: 'auto' | 'low' | 'high'
  /** Organization ID (OpenAI-specific) */
  organization?: string
  /** Enable JSON mode (response_format: json_object) */
  jsonMode?: boolean
  /** Ollama uses 'format' param instead of 'response_format' */
  isOllama?: boolean
}

/**
 * Known AI provider types
 */
export type KnownProvider
  = | 'claude'
    | 'openai'
    | 'groq'
    | 'together'
    | 'mistral'
    | 'ollama'

/**
 * Model information for a provider
 */
export interface ModelInfo {
  /** Model identifier */
  id: string
  /** Human-readable name */
  name: string
  /** Whether the model supports vision/images */
  vision: boolean
  /** Maximum context length in tokens */
  contextLength: number
}

/**
 * Provider information with available models
 */
export interface ProviderInfo {
  /** Provider identifier */
  id: KnownProvider
  /** Human-readable name */
  name: string
  /** Base URL for the API */
  baseURL: string
  /** Default model for this provider */
  defaultModel: string
  /** Environment variable name for API key */
  envKeyName: string
  /** Whether any models support vision */
  supportsVision: boolean
  /** Available models */
  models: ModelInfo[]
  /** Whether provider supports JSON mode */
  supportsJsonMode?: boolean
  /** Whether provider uses Ollama-style format param */
  isOllama?: boolean
}

/**
 * Factory type for creating drivers
 */
export type AIDriverFactory = (config: AIDriverConfig) => AIDriver
