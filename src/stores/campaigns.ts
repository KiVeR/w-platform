import type { CampaignListItem, CampaignStatusType } from '../../shared/types/campaign'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useCampaignsStore = defineStore('campaigns', () => {
  // State
  const items = ref<CampaignListItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const filters = ref({
    status: undefined as CampaignStatusType | undefined,
    search: '',
  })

  // Getters
  const hasItems = computed(() => items.value.length > 0)
  const isEmpty = computed(() => !isLoading.value && items.value.length === 0)
  const hasNextPage = computed(() => pagination.value.page < pagination.value.totalPages)
  const hasPreviousPage = computed(() => pagination.value.page > 1)

  // Actions
  function setItems(newItems: CampaignListItem[]) {
    items.value = newItems
  }

  function addItem(item: CampaignListItem) {
    items.value.unshift(item)
    pagination.value.total += 1
  }

  function updateItem(id: number, updates: Partial<CampaignListItem>) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...updates }
    }
  }

  function removeItem(id: number) {
    items.value = items.value.filter(item => item.id !== id)
    pagination.value.total -= 1
  }

  function setPagination(page: number, total: number, totalPages: number) {
    pagination.value.page = page
    pagination.value.total = total
    pagination.value.totalPages = totalPages
  }

  function setFilters(newFilters: Partial<typeof filters.value>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(err: string | null) {
    error.value = err
  }

  function reset() {
    items.value = []
    isLoading.value = false
    error.value = null
    pagination.value = { page: 1, limit: 20, total: 0, totalPages: 0 }
    filters.value = { status: undefined, search: '' }
  }

  return {
    // State
    items,
    isLoading,
    error,
    pagination,
    filters,
    // Getters
    hasItems,
    isEmpty,
    hasNextPage,
    hasPreviousPage,
    // Actions
    setItems,
    addItem,
    updateItem,
    removeItem,
    setPagination,
    setFilters,
    setLoading,
    setError,
    reset,
  }
})
