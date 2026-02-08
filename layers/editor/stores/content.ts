import type { PageStatusType } from '#shared/constants/status'
import type { Content, ContentType } from '#shared/types/content'
import { isEditorAvailable } from '#shared/types/content'

export const useContentStore = defineStore('content', () => {
  // State
  const id = ref<number | null>(null)
  const type = ref<ContentType | null>(null)
  const title = ref('')
  const status = ref<PageStatusType>('DRAFT')
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const createdAt = ref<Date | null>(null)
  const updatedAt = ref<Date | null>(null)

  // Getters
  const isNew = computed(() => id.value === null)
  const isLandingPage = computed(() => type.value === 'landing-page')
  const isRCS = computed(() => type.value === 'rcs')
  const isSMS = computed(() => type.value === 'sms')
  const hasEditor = computed(() => type.value !== null && isEditorAvailable(type.value))
  const isPlaceholder = computed(() => type.value !== null && !isEditorAvailable(type.value))

  // Actions
  function setContent(content: Content) {
    id.value = content.id
    type.value = content.type
    title.value = content.title
    status.value = content.status
    createdAt.value = new Date(content.createdAt)
    updatedAt.value = new Date(content.updatedAt)
    error.value = null
  }

  function setMetadata(data: {
    id?: number
    type?: ContentType
    title?: string
    status?: PageStatusType
  }) {
    if (data.id !== undefined)
      id.value = data.id
    if (data.type !== undefined)
      type.value = data.type
    if (data.title !== undefined)
      title.value = data.title
    if (data.status !== undefined)
      status.value = data.status
  }

  function updateTitle(newTitle: string) {
    title.value = newTitle
  }

  function updateStatus(newStatus: PageStatusType) {
    status.value = newStatus
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(err: string | null) {
    error.value = err
  }

  function reset() {
    id.value = null
    type.value = null
    title.value = ''
    status.value = 'DRAFT'
    isLoading.value = false
    error.value = null
    createdAt.value = null
    updatedAt.value = null
  }

  return {
    // State
    id,
    type,
    title,
    status,
    isLoading,
    error,
    createdAt,
    updatedAt,
    // Getters
    isNew,
    isLandingPage,
    isRCS,
    isSMS,
    hasEditor,
    isPlaceholder,
    // Actions
    setContent,
    setMetadata,
    updateTitle,
    updateStatus,
    setLoading,
    setError,
    reset,
  }
})
