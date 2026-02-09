import type {
  AIGenerationInput,
  AIStreamChunk,
  AITokenUsage,
} from '#shared/types/ai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import type { AIDriver, OpenAICompatibleDriverConfig } from './types'
import OpenAI from 'openai'
import { prepareForOpenAIApi } from '../parsers/image.parser'
import {
  buildConversationContext,
  buildUserMessage,
  DESIGN_GENERATION_SYSTEM_PROMPT,
} from '../prompts/design-generation'
import { parseDesignResponse, validateDesignAndEmitChunk } from '../utils/design-fix'

const DEFAULT_MAX_TOKENS = 8192
const DEFAULT_TEMPERATURE = 0.7

/**
 * OpenAI-Compatible Driver Implementation
 *
 * Works with any provider that implements the OpenAI Chat Completions API:
 * - OpenAI (GPT-4o, etc.)
 * - Groq (Llama, Mixtral)
 * - Together AI
 * - Mistral AI
 * - Ollama (local)
 * - Any custom endpoint
 */
export class OpenAICompatibleDriver implements AIDriver {
  readonly name: string
  readonly model: string

  private client: OpenAI
  private config: OpenAICompatibleDriverConfig

  constructor(config: OpenAICompatibleDriverConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required')
    }
    if (!config.model) {
      throw new Error('Model is required')
    }

    this.config = config
    this.name = config.providerName || 'OpenAI-Compatible'
    this.model = config.model

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
      defaultHeaders: config.headers,
    })
  }

  isConfigured(): boolean {
    return !!this.client
  }

  /**
   * Stream design generation
   */
  async* streamDesign(input: AIGenerationInput): AsyncGenerator<AIStreamChunk> {
    const messages = this.buildMessages(input)

    const requestParams: Record<string, unknown> = {
      model: this.model,
      max_tokens: this.config.maxTokens || DEFAULT_MAX_TOKENS,
      temperature: this.config.temperature ?? DEFAULT_TEMPERATURE,
      messages,
      stream: true,
    }

    // Enable JSON mode if supported
    if (this.config.jsonMode) {
      if (this.config.isOllama) {
        requestParams.format = 'json'
      }
      else {
        requestParams.response_format = { type: 'json_object' }
      }
    }

    try {
      yield* this.streamWithParams(requestParams)
    }
    catch (error) {
      // Fallback: retry without JSON mode if not supported
      if (this.config.jsonMode
        && error instanceof OpenAI.BadRequestError
        && error.message?.includes('response_format')) {
        console.warn(`[${this.name}] JSON mode not supported, retrying without it`)
        delete requestParams.response_format
        delete requestParams.format
        try {
          yield* this.streamWithParams(requestParams)
          return
        }
        catch (retryError) {
          yield this.handleError(retryError)
          yield { type: 'done', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } }
          return
        }
      }
      yield this.handleError(error)
      yield { type: 'done', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } }
    }
  }

  /**
   * Execute streaming request and yield parsed chunks
   */
  private async* streamWithParams(requestParams: Record<string, unknown>): AsyncGenerator<AIStreamChunk> {
    const stream = await this.client.chat.completions.create(requestParams as unknown as Parameters<typeof this.client.chat.completions.create>[0] & { stream: true })

    let fullResponse = ''
    let usage: AITokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    }

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta

      if (delta?.content) {
        fullResponse += delta.content
        yield { type: 'token', content: delta.content }
      }

      if (chunk.usage) {
        usage = {
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
          totalTokens: chunk.usage.total_tokens,
        }
      }
    }

    // Parse, validate, fix contrast, and emit design or error
    const design = parseDesignResponse(fullResponse, this.name)

    if (design) {
      yield validateDesignAndEmitChunk(design, this.name)
    }
    else {
      yield { type: 'error', content: 'Failed to parse design from response', code: 'GENERATION_FAILED' }
    }

    yield { type: 'done', usage }
  }

  /**
   * Build messages array for the API call
   */
  private buildMessages(input: AIGenerationInput): ChatCompletionMessageParam[] {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: DESIGN_GENERATION_SYSTEM_PROMPT },
    ]

    if (input.conversationHistory?.length) {
      const contextSummary = buildConversationContext(
        input.conversationHistory.map(m => ({
          role: m.role,
          content: m.content,
        })),
      )

      if (contextSummary) {
        messages.push({ role: 'user', content: contextSummary })
        messages.push({
          role: 'assistant',
          content: 'I understand the context. Please provide your next request.',
        })
      }
    }

    if (input.image && this.config.supportsVision !== false) {
      messages.push({
        role: 'user',
        content: [
          prepareForOpenAIApi(input.image, this.config.imageDetail || 'auto'),
          { type: 'text', text: buildUserMessage(input.prompt, true) },
        ],
      })
    }
    else {
      messages.push({
        role: 'user',
        content: buildUserMessage(input.prompt, false),
      })
    }

    return messages
  }

  /**
   * Handle API errors and map to stream chunks
   */
  private handleError(error: unknown): AIStreamChunk {
    if (error instanceof OpenAI.RateLimitError) {
      return {
        type: 'error',
        content: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT',
      }
    }

    if (error instanceof OpenAI.AuthenticationError) {
      return {
        type: 'error',
        content: `Invalid API key for ${this.name}`,
        code: 'GENERATION_FAILED',
      }
    }

    if (error instanceof OpenAI.NotFoundError) {
      return {
        type: 'error',
        content: `Model "${this.model}" not found on ${this.name}`,
        code: 'GENERATION_FAILED',
      }
    }

    if (error instanceof OpenAI.BadRequestError) {
      return {
        type: 'error',
        content: this.normalizeErrorMessage(error),
        code: 'GENERATION_FAILED',
      }
    }

    if (error instanceof OpenAI.APIConnectionError) {
      return {
        type: 'error',
        content: `Connection to ${this.name} failed. Check your network.`,
        code: 'GENERATION_FAILED',
      }
    }

    if (error instanceof OpenAI.APIError) {
      return {
        type: 'error',
        content: `${this.name} error: ${error.message}`,
        code: 'GENERATION_FAILED',
      }
    }

    return {
      type: 'error',
      content: error instanceof Error ? error.message : 'Unknown error',
      code: 'GENERATION_FAILED',
    }
  }

  /**
   * Normalize error messages for specific providers
   */
  private normalizeErrorMessage(error: InstanceType<typeof OpenAI.APIError>): string {
    const baseURL = this.config.baseURL || ''

    if (baseURL.includes('groq.com') && error.status === 413) {
      return 'Request too large. Try a smaller image or shorter prompt.'
    }

    if (baseURL.includes('together.xyz') && error.message?.includes('credit')) {
      return 'Insufficient credits on Together AI.'
    }

    if (error.message?.includes('content_policy')) {
      return 'Content was flagged by safety filters. Please modify your request.'
    }

    return error.message || 'Invalid request'
  }
}

/**
 * Create an OpenAI-compatible driver instance
 */
export function createOpenAICompatibleDriver(
  config: OpenAICompatibleDriverConfig,
): OpenAICompatibleDriver {
  return new OpenAICompatibleDriver(config)
}
