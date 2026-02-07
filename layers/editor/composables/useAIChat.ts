import type { AIChatRequest, AIImageInput, AIQuotaResponse, AIStreamChunk } from '#shared/types/ai'
import type { DesignDocument } from '@/types/widget'

/**
 * Composable for AI chat functionality
 *
 * Handles:
 * - SSE streaming for chat messages
 * - Quota management
 * - Image upload preparation
 * - Design application with history integration
 */
export function useAIChat() {
  const chatStore = useAIChatStore()
  const editorStore = useEditorStore()
  const historyStore = useHistoryStore()
  const widgetsStore = useWidgetsStore()
  const config = useEditorConfig()
  const api = useEditorApi()

  /**
   * Fetch current quota from API
   */
  async function fetchQuota(): Promise<void> {
    try {
      const response = await api.get<AIQuotaResponse>('/ai/quota')
      chatStore.setQuota(response.quota)
    }
    catch (error) {
      console.error('[AI] Failed to fetch quota:', error)
    }
  }

  /**
   * Send a message to the AI and stream the response
   */
  async function sendMessage(prompt: string, image?: AIImageInput): Promise<void> {
    if (!chatStore.canSend || !prompt.trim())
      return

    // Add user message to conversation
    chatStore.addUserMessage(prompt, image)
    chatStore.startAssistantMessage()

    // Clear pending image after sending
    chatStore.setPendingImage(null)

    // Build request
    const request: AIChatRequest = {
      prompt,
      image,
      conversationHistory: chatStore.getConversationHistory().slice(0, -1), // Exclude the message we just added
      context: {
        currentWidgets: editorStore.design?.widgets?.length ?? 0,
        contentType: 'landing-page', // TODO: Get from current content context
      },
    }

    try {
      // Make SSE request using native fetch (not $fetch) for streaming support
      const token = config.getAuthToken()
      const url = `${config.apiBaseUrl}/ai/chat`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      // Process SSE stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let generatedDesign: DesignDocument | undefined

      while (true) {
        const { done, value } = await reader.read()

        if (done)
          break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        let eventType = ''
        let eventData = ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7)
          }
          else if (line.startsWith('data: ')) {
            eventData = line.slice(6)
          }
          else if (line === '' && eventType && eventData) {
            // End of event, process it
            try {
              const chunk = JSON.parse(eventData) as AIStreamChunk
              handleStreamChunk(chunk, (design) => {
                generatedDesign = design
              })
            }
            catch (parseError) {
              console.error('[AI] Failed to parse chunk:', parseError)
            }

            eventType = ''
            eventData = ''
          }
        }
      }

      // Complete the message
      chatStore.completeAssistantMessage(generatedDesign)

      // Refresh quota after generation
      fetchQuota()
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      chatStore.setError(message)
      console.error('[AI] Chat error:', error)
    }
  }

  /**
   * Handle a single stream chunk
   */
  function handleStreamChunk(
    chunk: AIStreamChunk,
    onDesign: (design: DesignDocument) => void,
  ): void {
    switch (chunk.type) {
      case 'token':
        chatStore.appendStreamText(chunk.content)
        break

      case 'design':
        onDesign(chunk.content as DesignDocument)
        break

      case 'error':
        chatStore.setError(chunk.content)
        break

      case 'done':
        // Stream complete - usage info available in chunk.usage if needed
        break
    }
  }

  /**
   * Apply a generated design to the current document
   * Integrates with history store for undo support
   */
  function applyDesign(design: DesignDocument): void {
    // Save current state for undo (use toRaw to avoid structuredClone issues with Vue proxies)
    if (editorStore.design) {
      historyStore.pushState(toRaw(editorStore.design))
    }

    // Apply the new design to editor store
    editorStore.setDesign(design)

    // Sync widgets with the widgets store
    widgetsStore.setWidgets(design.widgets || [])
  }

  /**
   * Prepare an image file for upload
   */
  async function prepareImage(file: File): Promise<AIImageInput | null> {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      chatStore.setError(`Type de fichier non supporté: ${file.type}`)
      return null
    }

    // Validate file size (4MB max)
    const maxSize = 4 * 1024 * 1024
    if (file.size > maxSize) {
      chatStore.setError('Image trop grande (max 4MB)')
      return null
    }

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Extract base64 data without the data URL prefix
        const base64Data = result.split(',')[1]

        const image: AIImageInput = {
          data: base64Data,
          mimeType: file.type as AIImageInput['mimeType'],
        }

        resolve(image)
      }
      reader.onerror = () => {
        chatStore.setError('Erreur lors de la lecture du fichier')
        resolve(null)
      }
      reader.readAsDataURL(file)
    })
  }

  /**
   * Set a pending image for the next message
   */
  async function attachImage(file: File): Promise<void> {
    const image = await prepareImage(file)
    if (image) {
      chatStore.setPendingImage(image)
    }
  }

  /**
   * Remove the pending image
   */
  function removeImage(): void {
    chatStore.setPendingImage(null)
  }

  return {
    // Store access
    store: chatStore,

    // Actions
    fetchQuota,
    sendMessage,
    applyDesign,
    prepareImage,
    attachImage,
    removeImage,
  }
}
