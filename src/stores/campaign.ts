import type { CampaignStatusType, CampaignWithContents } from '../../shared/types/campaign'
import type { ContentType } from '../../shared/types/content'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useCampaignStore = defineStore('campaign', () => {
  // State
  const id = ref<number | null>(null)
  const title = ref('')
  const description = ref<string | null>(null)
  const status = ref<CampaignStatusType>('DRAFT')
  const enabledContentTypes = ref<ContentType[]>([])
  const contents = ref<CampaignWithContents['contents']>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const createdAt = ref<Date | null>(null)
  const updatedAt = ref<Date | null>(null)

  // Getters
  const isNew = computed(() => id.value === null)
  const hasContents = computed(() => contents.value.length > 0)
  const contentCount = computed(() => contents.value.length)

  const contentsByType = computed(() => {
    const result: Record<ContentType, typeof contents.value> = {
      'landing-page': [],
      'rcs': [],
      'sms': [],
    }
    for (const content of contents.value) {
      result[content.type].push(content)
    }
    return result
  })

  const canAddContentType = (type: ContentType) => {
    return enabledContentTypes.value.includes(type)
  }

  // Actions
  function setCampaign(campaign: CampaignWithContents) {
    id.value = campaign.id
    title.value = campaign.title
    description.value = campaign.description ?? null
    status.value = campaign.status
    enabledContentTypes.value = campaign.enabledContentTypes
    contents.value = campaign.contents
    createdAt.value = new Date(campaign.createdAt)
    updatedAt.value = new Date(campaign.updatedAt)
    error.value = null
  }

  function updateTitle(newTitle: string) {
    title.value = newTitle
  }

  function updateDescription(newDescription: string | null) {
    description.value = newDescription
  }

  function updateStatus(newStatus: CampaignStatusType) {
    status.value = newStatus
  }

  function updateEnabledContentTypes(types: ContentType[]) {
    enabledContentTypes.value = types
  }

  function addContent(content: CampaignWithContents['contents'][0]) {
    contents.value.push(content)
  }

  function updateContent(contentId: number, updates: Partial<CampaignWithContents['contents'][0]>) {
    const index = contents.value.findIndex(c => c.id === contentId)
    if (index !== -1) {
      contents.value[index] = { ...contents.value[index], ...updates }
    }
  }

  function removeContent(contentId: number) {
    contents.value = contents.value.filter(c => c.id !== contentId)
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(err: string | null) {
    error.value = err
  }

  function reset() {
    id.value = null
    title.value = ''
    description.value = null
    status.value = 'DRAFT'
    enabledContentTypes.value = []
    contents.value = []
    isLoading.value = false
    error.value = null
    createdAt.value = null
    updatedAt.value = null
  }

  return {
    // State
    id,
    title,
    description,
    status,
    enabledContentTypes,
    contents,
    isLoading,
    error,
    createdAt,
    updatedAt,
    // Getters
    isNew,
    hasContents,
    contentCount,
    contentsByType,
    canAddContentType,
    // Actions
    setCampaign,
    updateTitle,
    updateDescription,
    updateStatus,
    updateEnabledContentTypes,
    addContent,
    updateContent,
    removeContent,
    setLoading,
    setError,
    reset,
  }
})
