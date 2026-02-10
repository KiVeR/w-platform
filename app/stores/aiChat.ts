import type { AIChatMessage, AIImageInput, AIQuotaInfo } from '#shared/types/ai'

const MAX_CONVERSATION_LENGTH = 20
const JSON_SEPARATOR = '---JSON---'

/**
 * Extract the human-readable description text from a stream response,
 * stripping the JSON design payload that follows the separator.
 */
function extractDescriptionText(text: string): string {
  const sepIndex = text.indexOf(JSON_SEPARATOR)
  if (sepIndex !== -1)
    return text.slice(0, sepIndex).trim()

  const braceIndex = text.indexOf('\n{')
  if (braceIndex !== -1)
    return text.slice(0, braceIndex).trim()

  if (text.trimStart().startsWith('{'))
    return ''

  return text
}

export const useAIChatStore = defineStore('aiChat', () => {
  // State
  const isOpen = ref(false)
  const messages = ref<AIChatMessage[]>([])
  const isStreaming = ref(false)
  const currentStreamText = ref('')
  const pendingImage = ref<AIImageInput | null>(null)
  const quota = ref<AIQuotaInfo | null>(null)
  const error = ref<string | null>(null)

  // Getters
  const canSend = computed(() => !isStreaming.value && quota.value?.canGenerate !== false)
  const hasMessages = computed(() => messages.value.length > 0)
  const lastAssistantMessage = computed(() =>
    [...messages.value].reverse().find(m => m.role === 'assistant'),
  )
  const lastGeneratedDesign = computed(() => lastAssistantMessage.value?.design as DesignDocument | undefined)

  const displayStreamText = computed(() => extractDescriptionText(currentStreamText.value))

  const isGeneratingDesign = computed(() => {
    if (!isStreaming.value)
      return false
    const text = currentStreamText.value
    return text.includes(JSON_SEPARATOR) || text.trimStart().startsWith('{')
  })

  // Actions
  function open() {
    isOpen.value = true
    error.value = null
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    if (isOpen.value) {
      close()
    }
    else {
      open()
    }
  }

  function addUserMessage(content: string, image?: AIImageInput) {
    const message: AIChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      role: 'user',
      content,
      image,
      createdAt: new Date(),
    }
    messages.value.push(message)

    // Limit conversation length
    if (messages.value.length > MAX_CONVERSATION_LENGTH) {
      messages.value = messages.value.slice(-MAX_CONVERSATION_LENGTH)
    }
  }

  function startAssistantMessage() {
    currentStreamText.value = ''
    isStreaming.value = true
    error.value = null
  }

  function appendStreamText(text: string) {
    currentStreamText.value += text
  }

  function completeAssistantMessage(design?: DesignDocument) {
    const message: AIChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      role: 'assistant',
      content: extractDescriptionText(currentStreamText.value),
      design,
      createdAt: new Date(),
    }
    messages.value.push(message)
    currentStreamText.value = ''
    isStreaming.value = false
  }

  function setError(errorMessage: string) {
    error.value = errorMessage
    isStreaming.value = false
    currentStreamText.value = ''
  }

  function clearError() {
    error.value = null
  }

  function setPendingImage(image: AIImageInput | null) {
    pendingImage.value = image
  }

  function setQuota(quotaInfo: AIQuotaInfo) {
    quota.value = quotaInfo
  }

  function clearConversation() {
    messages.value = []
    currentStreamText.value = ''
    error.value = null
    pendingImage.value = null
  }

  function getConversationHistory(): AIChatMessage[] {
    // Return messages for context (excluding current streaming)
    return messages.value.slice(-MAX_CONVERSATION_LENGTH)
  }

  return {
    // State
    isOpen,
    messages,
    isStreaming,
    currentStreamText,
    pendingImage,
    quota,
    error,
    // Getters
    canSend,
    hasMessages,
    lastAssistantMessage,
    lastGeneratedDesign,
    displayStreamText,
    isGeneratingDesign,
    // Actions
    open,
    close,
    toggle,
    addUserMessage,
    startAssistantMessage,
    appendStreamText,
    completeAssistantMessage,
    setError,
    clearError,
    setPendingImage,
    setQuota,
    clearConversation,
    getConversationHistory,
  }
})
