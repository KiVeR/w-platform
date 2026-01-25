import type {
  AIGenerationInput,
  AIStreamChunk,
  AITokenUsage,
} from '#shared/types/ai'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'
import type { AIDriver, ClaudeDriverConfig } from './types'
import { designDocumentSchema } from '#shared/schemas/design.schema'
import Anthropic from '@anthropic-ai/sdk'
import { prepareForAnthropicApi } from '../parsers/image.parser'
import {
  buildConversationContext,
  buildUserMessage,
  DESIGN_GENERATION_SYSTEM_PROMPT,
} from '../prompts/design-generation'

const DEFAULT_MODEL = 'claude-sonnet-4-20250514'
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
      // Create streaming message
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

      // Stream text tokens
      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta
          if ('text' in delta) {
            fullResponse += delta.text
            yield {
              type: 'token',
              content: delta.text,
            }
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

      // Parse and validate the generated design
      const design = this.parseDesignFromResponse(fullResponse)

      if (design) {
        // Validate with Zod schema
        const parseResult = designDocumentSchema.safeParse(design)

        if (parseResult.success) {
          yield {
            type: 'design',
            content: parseResult.data,
          }
        }
        else {
          // Try to fix common issues and retry validation
          const fixedDesign = this.attemptDesignFix(design, parseResult.error.errors)
          const retryResult = designDocumentSchema.safeParse(fixedDesign)

          if (retryResult.success) {
            yield {
              type: 'design',
              content: retryResult.data,
            }
          }
          else {
            yield {
              type: 'error',
              content: `Design validation failed: ${parseResult.error.errors.map(e => e.message).join(', ')}`,
              code: 'GENERATION_FAILED',
            }
          }
        }
      }
      else {
        yield {
          type: 'error',
          content: 'Failed to parse design from response',
          code: 'GENERATION_FAILED',
        }
      }

      // Send usage info
      const usage: AITokenUsage = {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
      }

      yield {
        type: 'done',
        usage,
      }
    }
    catch (error) {
      // Handle Anthropic API errors
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

    // Add conversation history if present
    if (input.conversationHistory && input.conversationHistory.length > 0) {
      // Add context message
      const contextSummary = buildConversationContext(
        input.conversationHistory.map(m => ({
          role: m.role,
          content: m.content,
        })),
      )

      if (contextSummary) {
        messages.push({
          role: 'user',
          content: contextSummary,
        })
        messages.push({
          role: 'assistant',
          content: 'I understand the context. Please provide your next request.',
        })
      }
    }

    // Build current message with optional image
    const userContent: MessageParam['content'] = []

    // Add image if present
    if (input.image) {
      userContent.push(prepareForAnthropicApi(input.image))
    }

    // Add text prompt
    userContent.push({
      type: 'text',
      text: buildUserMessage(input.prompt, !!input.image),
    })

    messages.push({
      role: 'user',
      content: userContent,
    })

    return messages
  }

  /**
   * Parse design JSON from the response text
   */
  private parseDesignFromResponse(response: string): unknown {
    // Try to extract JSON from the response
    let jsonStr = response.trim()

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7)
    }
    else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3)
    }

    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3)
    }

    jsonStr = jsonStr.trim()

    // Try to find JSON object boundaries
    const startIdx = jsonStr.indexOf('{')
    const endIdx = jsonStr.lastIndexOf('}')

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      jsonStr = jsonStr.slice(startIdx, endIdx + 1)
    }

    try {
      return JSON.parse(jsonStr)
    }
    catch {
      console.error('Failed to parse JSON:', jsonStr.substring(0, 200))
      return null
    }
  }

  /**
   * Attempt to fix common validation issues
   */
  private attemptDesignFix(design: unknown, _errors: unknown[]): unknown {
    if (!design || typeof design !== 'object')
      return design

    const doc = design as Record<string, unknown>

    // Ensure version exists
    if (!doc.version) {
      doc.version = '1.0'
    }

    // Ensure globalStyles exists with defaults
    if (!doc.globalStyles || typeof doc.globalStyles !== 'object') {
      doc.globalStyles = {
        backgroundColor: '#ffffff',
        textColor: '#1e293b',
        primaryColor: '#3b82f6',
      }
    }

    // Ensure widgets is an array
    if (!Array.isArray(doc.widgets)) {
      doc.widgets = []
    }

    // Fix widget IDs and orders
    let idCounter = 1
    const fixWidgets = (widgets: unknown[]): unknown[] => {
      return widgets.map((widget, index) => {
        if (!widget || typeof widget !== 'object')
          return widget

        const w = widget as Record<string, unknown>

        // Ensure ID
        if (!w.id || typeof w.id !== 'string') {
          w.id = `widget_${idCounter++}`
        }
        else {
          idCounter++
        }

        // Ensure order
        if (typeof w.order !== 'number') {
          w.order = index
        }

        // Ensure content exists
        if (!w.content || typeof w.content !== 'object') {
          w.content = {}
        }

        // Ensure styles exists
        if (!w.styles || typeof w.styles !== 'object') {
          w.styles = {}
        }

        // Recursively fix children
        if (Array.isArray(w.children)) {
          w.children = fixWidgets(w.children)
        }

        return w
      })
    }

    doc.widgets = fixWidgets(doc.widgets as unknown[])

    return doc
  }
}

/**
 * Create a Claude driver instance
 */
export function createClaudeDriver(apiKey: string, model?: ClaudeDriverConfig['model']): ClaudeDriver {
  return new ClaudeDriver({ apiKey, model })
}
