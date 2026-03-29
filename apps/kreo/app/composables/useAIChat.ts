import type { AIImageInput, AIQuotaResponse } from '#shared/types/ai'

const MAX_POLLS = 150
const POLL_INTERVAL = 2000

/**
 * Composable for AI chat functionality
 *
 * Handles:
 * - Async polling for AI generation (POST /ai/generate -> poll GET /ai/generate/{jobId}/status)
 * - Quota management
 * - Image upload preparation
 * - Design application with history integration
 */
export function useAIChat() {
  const chatStore = useAIChatStore()
  const editorStore = useEditorStore()
  const historyStore = useHistoryStore()
  const widgetsStore = useWidgetsStore()
  const api = useApi()

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
   * Send a message to the AI and poll for the generated result
   */
  async function sendMessage(prompt: string, image?: AIImageInput): Promise<void> {
    if (!chatStore.canSend || !prompt.trim())
      return

    chatStore.addUserMessage(prompt, image)
    chatStore.setGenerating(true)
    chatStore.setPendingImage(null)

    const contentStore = useContentStore()

    try {
      // 1. Submit generation job
      chatStore.setProgress('submitting')

      const submitResponse = await api.post<{ data: { job_id: string, status: string } }>('/ai/generate', {
        prompt,
        image,
        conversationHistory: chatStore.getConversationHistory().slice(0, -1),
        context: {
          currentWidgets: editorStore.design?.widgets?.length ?? 0,
          contentType: contentStore.type || 'landing-page',
        },
      })

      const jobId = submitResponse.data.job_id

      // 2. Poll for result
      chatStore.setProgress('generating')
      const result = await pollForResult(jobId)

      // 3. Apply result
      chatStore.completeGeneration(result.design, result.usage)
      fetchQuota()
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      chatStore.setError(message)
      console.error('[AI] Chat error:', error)
    }
  }

  /**
   * Poll the generation job status until completed, failed, or cancelled
   */
  async function pollForResult(jobId: string): Promise<{ design: DesignDocument, usage?: unknown }> {
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))

      // Check if user cancelled
      if (chatStore.isCancelled()) {
        throw new Error('Generation annulee')
      }

      const pollResponse = await api.get<{ data: { status: string, result?: { design: DesignDocument, usage?: unknown }, error?: string } }>(
        `/ai/generate/${jobId}/status`,
      )

      const data = pollResponse.data

      if (data.status === 'completed') {
        if (!data.result) {
          throw new Error('Resultat manquant dans la reponse')
        }
        return data.result
      }

      if (data.status === 'failed') {
        throw new Error(data.error || 'Generation echouee')
      }
    }

    throw new Error('Timeout — generation trop longue')
  }

  /**
   * Cancel an ongoing generation
   */
  function cancel(): void {
    chatStore.cancelGeneration()
  }

  /**
   * Apply a generated design to the current document with undo support
   */
  function applyDesign(design: DesignDocument): void {
    // toRaw avoids structuredClone issues with Vue proxies
    if (editorStore.design) {
      historyStore.pushState(toRaw(editorStore.design))
    }

    editorStore.setDesign(design)
    widgetsStore.setWidgets(design.widgets || [])
  }

  /**
   * Prepare an image file for upload
   */
  async function prepareImage(file: File): Promise<AIImageInput | null> {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      chatStore.setError(`Type de fichier non supporte: ${file.type}`)
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
        const base64Data = (reader.result as string).split(',')[1]
        resolve({
          data: base64Data,
          mimeType: file.type as AIImageInput['mimeType'],
        })
      }
      reader.onerror = () => {
        chatStore.setError('Erreur lors de la lecture du fichier')
        resolve(null)
      }
      reader.readAsDataURL(file)
    })
  }

  async function attachImage(file: File): Promise<void> {
    const image = await prepareImage(file)
    if (image) {
      chatStore.setPendingImage(image)
    }
  }

  function removeImage(): void {
    chatStore.setPendingImage(null)
  }

  return {
    // Store access
    store: chatStore,

    // Actions
    fetchQuota,
    sendMessage,
    cancel,
    applyDesign,
    prepareImage,
    attachImage,
    removeImage,
  }
}
