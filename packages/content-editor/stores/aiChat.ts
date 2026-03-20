import type { AIChatMessage, AIImageInput, AIQuotaInfo } from '../types/ai'

const MAX_CONVERSATION_LENGTH = 20

export const useAIChatStore = defineStore('aiChat', () => {
  const isOpen = ref(false)
  const messages = ref<AIChatMessage[]>([])
  const isGenerating = ref(false)
  const pendingImage = ref<AIImageInput | null>(null)
  const quota = ref<AIQuotaInfo | null>(null)
  const error = ref<string | null>(null)

  const canSend = computed(() => !isGenerating.value && quota.value?.can_generate !== false)
  const hasMessages = computed(() => messages.value.length > 0)
  const lastAssistantMessage = computed(() => [...messages.value].reverse().find(m => m.role === 'assistant'))
  const lastGeneratedDesign = computed(() => lastAssistantMessage.value?.design as DesignDocument | undefined)

  function open() {
    isOpen.value = true
    error.value = null
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value ? close() : open()
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
    if (messages.value.length > MAX_CONVERSATION_LENGTH) {
      messages.value = messages.value.slice(-MAX_CONVERSATION_LENGTH)
    }
  }

  function startAssistantMessage() {
    isGenerating.value = true
    error.value = null
  }

  function completeAssistantMessage(design?: DesignDocument, description?: string) {
    const message: AIChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      role: 'assistant',
      content: description ?? '',
      design,
      createdAt: new Date(),
    }
    messages.value.push(message)
    isGenerating.value = false
  }

  function setError(errorMessage: string) {
    error.value = errorMessage
    isGenerating.value = false
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
    error.value = null
    pendingImage.value = null
  }

  function getConversationHistory(): AIChatMessage[] {
    return messages.value.slice(-MAX_CONVERSATION_LENGTH)
  }

  return {
    isOpen,
    messages,
    isGenerating,
    pendingImage,
    quota,
    error,
    canSend,
    hasMessages,
    lastAssistantMessage,
    lastGeneratedDesign,
    open,
    close,
    toggle,
    addUserMessage,
    startAssistantMessage,
    completeAssistantMessage,
    setError,
    clearError,
    setPendingImage,
    setQuota,
    clearConversation,
    getConversationHistory,
  }
})
