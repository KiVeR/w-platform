import type { AIGenerateResponse, AIImageInput, AIJobStatusResponse } from '../types/ai'
import type { DesignDocument } from '../types/widget'

const POLL_INTERVAL_MS = 2000

export function useAIChat() {
  const chatStore = useAIChatStore()
  const editorStore = useEditorStore()
  const historyStore = useHistoryStore()
  const widgetsStore = useWidgetsStore()
  const api = useEditorApi()

  async function fetchQuota(): Promise<void> {
    try {
      const response = await api.get<{ remaining: number; limit: number; resets_at: string; can_generate: boolean }>('/ai/quota')
      chatStore.setQuota({
        remaining: response.remaining,
        limit: response.limit,
        resetsAt: new Date(response.resets_at),
        canGenerate: response.can_generate,
      })
    }
    catch (error) {
      console.error('[AI] Failed to fetch quota:', error)
    }
  }

  async function sendMessage(prompt: string, image?: AIImageInput): Promise<void> {
    if (!chatStore.canSend || !prompt.trim())
      return

    chatStore.addUserMessage(prompt, image)
    chatStore.setGenerating(true)
    chatStore.setProgress('submitting')
    chatStore.setPendingImage(null)

    try {
      // POST to generate — returns jobId (202 Accepted)
      const result = await api.post<AIGenerateResponse>('/ai/generate', {
        prompt,
        image,
        conversation_history: chatStore.getConversationHistory().slice(0, -1).map(m => ({
          role: m.role,
          content: m.content,
        })),
      })

      // Poll for result every 2 seconds
      const jobId = result.job_id
      let status = 'pending'
      let jobResult: AIJobStatusResponse | null = null

      while (status === 'pending') {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
        jobResult = await api.get<AIJobStatusResponse>(`/ai/generate/${jobId}/status`)
        status = jobResult.status
      }

      chatStore.setProgress('generating')

      if (status === 'completed' && jobResult?.design) {
        chatStore.completeGeneration(jobResult.design as unknown as DesignDocument)
      }
      else if (status === 'failed') {
        chatStore.setError(jobResult?.error ?? 'Generation failed')
      }
      else {
        // completed but no design
        chatStore.completeGeneration(undefined as unknown as DesignDocument)
      }

      // Refresh quota after generation (fire-and-forget)
      fetchQuota()
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      chatStore.setError(message)
    }
  }

  function applyDesign(design: DesignDocument): void {
    const currentDesign = editorStore.design
    if (currentDesign) {
      historyStore.pushState(toRaw(currentDesign))
    }
    editorStore.setDesign(design)
    widgetsStore.setWidgets(design.widgets ?? [])
  }

  async function prepareImage(file: File): Promise<AIImageInput | null> {
    const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      chatStore.setError(`Type de fichier non supporté: ${file.type}`)
      return null
    }
    const maxSize = 4 * 1024 * 1024 // 4 MB
    if (file.size > maxSize) {
      chatStore.setError('Image trop grande (max 4MB)')
      return null
    }
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1]
        if (!base64Data) {
          chatStore.setError('Image invalide')
          resolve(null)
          return
        }
        resolve({ data: base64Data, mimeType: file.type as AIImageInput['mimeType'] })
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
    if (image)
      chatStore.setPendingImage(image)
  }

  function removeImage(): void {
    chatStore.setPendingImage(null)
  }

  return {
    store: chatStore,
    fetchQuota,
    sendMessage,
    applyDesign,
    prepareImage,
    attachImage,
    removeImage,
  }
}
