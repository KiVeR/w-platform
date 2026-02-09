import type {
  AIGenerationInput,
  AIStreamChunk,
  AITokenUsage,
} from '#shared/types/ai'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'
import type { AIDriver, ClaudeDriverConfig } from './types'
import Anthropic from '@anthropic-ai/sdk'
import { prepareForAnthropicApi } from '../parsers/image.parser'
import {
  buildConversationContext,
  buildUserMessage,
  DESIGN_GENERATION_SYSTEM_PROMPT,
} from '../prompts/design-generation'
import { parseDesignResponse, validateDesignAndEmitChunk } from '../utils/design-fix'

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'
const MAX_TOKENS = 8192
const TEMPERATURE = 0.7

/**
 * Claude Driver Implementation
 *
 * Uses the Anthropic SDK to generate designs via Claude's vision API
 * with streaming support.
 */
export class ClaudeDriver implements AIDriver {
  readonly name = 'Claude'
  readonly model: string

  private client: Anthropic

  constructor(config: ClaudeDriverConfig) {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required')
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
    })

    this.model = config.model || DEFAULT_MODEL
  }

  isConfigured(): boolean {
    return !!this.client
  }

  /**
   * Stream design generation from Claude
   */
  async* streamDesign(input: AIGenerationInput): AsyncGenerator<AIStreamChunk> {
    const messages = this.buildMessages(input)

    try {
      const stream = this.client.messages.stream({
        model: this.model,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: DESIGN_GENERATION_SYSTEM_PROMPT,
        messages,
      })

      let fullResponse = ''
      let inputTokens = 0
      let outputTokens = 0

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta
          if ('text' in delta) {
            fullResponse += delta.text
            yield { type: 'token', content: delta.text }
          }
        }
        else if (event.type === 'message_delta') {
          if ('usage' in event && event.usage) {
            outputTokens = event.usage.output_tokens || 0
          }
        }
        else if (event.type === 'message_start') {
          if ('message' in event && event.message?.usage) {
            inputTokens = event.message.usage.input_tokens || 0
          }
        }
      }

      // Parse, validate, fix contrast, and emit design or error
      const design = parseDesignResponse(fullResponse, this.name)

      if (design) {
        yield validateDesignAndEmitChunk(design, this.name)
      }
      else {
        yield {
          type: 'error',
          content: 'Failed to parse design from response',
          code: 'GENERATION_FAILED',
        }
      }

      const usage: AITokenUsage = {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
      }

      yield { type: 'done', usage }
    }
    catch (error) {
      if (error instanceof Anthropic.RateLimitError) {
        yield {
          type: 'error',
          content: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT',
        }
      }
      else if (error instanceof Anthropic.APIError) {
        yield {
          type: 'error',
          content: `API error: ${error.message}`,
          code: 'GENERATION_FAILED',
        }
      }
      else {
        yield {
          type: 'error',
          content: error instanceof Error ? error.message : 'Unknown error',
          code: 'GENERATION_FAILED',
        }
      }

      yield {
        type: 'done',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      }
    }
  }

  /**
   * Build messages array for the API call
   */
  private buildMessages(input: AIGenerationInput): MessageParam[] {
    const messages: MessageParam[] = []

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

    const userContent: MessageParam['content'] = []

    if (input.image) {
      userContent.push(prepareForAnthropicApi(input.image))
    }

    userContent.push({
      type: 'text',
      text: buildUserMessage(input.prompt, !!input.image),
    })

    messages.push({ role: 'user', content: userContent })

    return messages
  }
}

/**
 * Create a Claude driver instance
 */
export function createClaudeDriver(apiKey: string, model?: ClaudeDriverConfig['model']): ClaudeDriver {
  return new ClaudeDriver({ apiKey, model })
}
