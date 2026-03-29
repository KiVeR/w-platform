import type { AIChatMessage, AIImageInput, AIQuotaInfo } from '#shared/types/ai'

const MAX_CONVERSATION_LENGTH = 20

export type AIProgressState = 'idle' | 'submitting' | 'generating' | 'completed' | 'failed'

export const useAIChatStore = defineStore('aiChat', () => {
  // State
  const isOpen = ref(false)
  const messages = ref<AIChatMessage[]>([])
  const isGenerating = ref(false)
  const progress = ref<AIProgressState>('idle')
  const elapsedSeconds = ref(0)
  const pendingImage = ref<AIImageInput | null>(null)
  const quota = ref<AIQuotaInfo | null>(null)
  const error = ref<string | null>(null)
  const _cancelled = ref(false)

  let _elapsedTimer: ReturnType<typeof setInterval> | null = null

  // Getters
  const canSend = computed(() => !isGenerating.value && quota.value?.canGenerate !== false)
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

  function setGenerating(value: boolean) {
    isGenerating.value = value
    if (value) {
      _cancelled.value = false
      error.value = null
    }
  }

  function setProgress(p: AIProgressState) {
    progress.value = p

    if (p === 'generating') {
      _startElapsedTimer()
    }
    else if (p === 'idle' || p === 'completed' || p === 'failed') {
      _stopElapsedTimer()
    }
  }

  function _startElapsedTimer() {
    elapsedSeconds.value = 0
    _stopElapsedTimer()
    _elapsedTimer = setInterval(() => {
      elapsedSeconds.value++
    }, 1000)
  }

  function _stopElapsedTimer() {
    if (_elapsedTimer) {
      clearInterval(_elapsedTimer)
      _elapsedTimer = null
    }
  }

  function completeGeneration(design: DesignDocument, _usage?: unknown) {
    const message: AIChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      role: 'assistant',
      content: 'Design genere avec succes.',
      design,
      createdAt: new Date(),
    }
    messages.value.push(message)
    isGenerating.value = false
    progress.value = 'completed'
    _stopElapsedTimer()
  }

  function cancelGeneration() {
    _cancelled.value = true
    isGenerating.value = false
    progress.value = 'idle'
    _stopElapsedTimer()
  }

  function isCancelled(): boolean {
    return _cancelled.value
  }

  function setError(errorMessage: string) {
    error.value = errorMessage
    isGenerating.value = false
    progress.value = 'failed'
    _stopElapsedTimer()
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
    progress.value = 'idle'
    elapsedSeconds.value = 0
    _stopElapsedTimer()
  }

  function getConversationHistory(): AIChatMessage[] {
    return messages.value.slice(-MAX_CONVERSATION_LENGTH)
  }

  return {
    // State
    isOpen,
    messages,
    isGenerating,
    progress,
    elapsedSeconds,
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
    setGenerating,
    setProgress,
    completeGeneration,
    cancelGeneration,
    isCancelled,
    setError,
    clearError,
    setPendingImage,
    setQuota,
    clearConversation,
    getConversationHistory,
  }
})
