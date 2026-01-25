import type { RoleType } from '#shared/constants/roles'
import { aiChatRequestSchema } from '#shared/schemas/ai.schema'
import { getAIGenerationService } from '../../../services/ai/generation.service'

/**
 * POST /api/v1/ai/chat
 *
 * Server-Sent Events endpoint for AI design generation.
 * Streams tokens and design results in real-time.
 *
 * Events:
 * - token: Text chunk from the AI
 * - design: Generated DesignDocument JSON
 * - error: Error message with code
 * - done: Completion with token usage
 */
export default defineEventHandler(async (event) => {
  // Require authentication
  const user = await requireAuth(event)

  // Parse and validate request body
  const body = await readBody(event)
  const parseResult = aiChatRequestSchema.safeParse(body)

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: `Invalid request: ${parseResult.error.errors.map(e => e.message).join(', ')}`,
    })
  }

  const request = parseResult.data

  // Get AI service
  const aiService = getAIGenerationService()

  if (!aiService.isAvailable()) {
    throw createError({
      statusCode: 503,
      message: 'AI service is not available. Please contact administrator.',
    })
  }

  // Set up SSE headers
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no') // Disable nginx buffering

  // Create response stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Stream chunks from AI service
        const generator = aiService.generate(
          {
            prompt: request.prompt,
            image: request.image,
            conversationHistory: request.conversationHistory,
            context: request.context,
          },
          user.id,
          user.role as RoleType,
        )

        for await (const chunk of generator) {
          // Format as SSE
          const data = JSON.stringify(chunk)
          const sseMessage = `event: ${chunk.type}\ndata: ${data}\n\n`
          controller.enqueue(encoder.encode(sseMessage))
        }

        controller.close()
      }
      catch (error) {
        // Send error event
        const errorChunk = {
          type: 'error',
          content: error instanceof Error ? error.message : 'Unknown error',
          code: 'GENERATION_FAILED',
        }
        const sseMessage = `event: error\ndata: ${JSON.stringify(errorChunk)}\n\n`
        controller.enqueue(encoder.encode(sseMessage))
        controller.close()
      }
    },
  })

  // Send the stream
  return sendStream(event, stream)
})
