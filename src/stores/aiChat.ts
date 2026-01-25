import type { AIChatMessage, AIImageInput, AIQuotaInfo } from '#shared/types/ai'
import type { DesignDocument } from '@/types/widget'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const MAX_CONVERSATION_LENGTH = 20

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
      content: currentStreamText.value,
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
    return messages.value.slice(-10) // Last 10 messages for context
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
