import type { PageStatusType } from '#shared/constants/status'
import type { ContentListItem, ContentType } from '#shared/types/content'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useContentsStore = defineStore('contents', () => {
  // State
  const items = ref<ContentListItem[]>([])
  const recentItems = ref<ContentListItem[]>([])
  const favoriteItems = ref<ContentListItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const filters = ref({
    type: undefined as ContentType | undefined,
    status: undefined as PageStatusType | undefined,
    search: '',
  })

  // Getters
  const hasItems = computed(() => items.value.length > 0)
  const isEmpty = computed(() => !isLoading.value && items.value.length === 0)
  const hasNextPage = computed(() => pagination.value.page < pagination.value.totalPages)
  const hasPreviousPage = computed(() => pagination.value.page > 1)
  const hasRecent = computed(() => recentItems.value.length > 0)
  const hasFavorites = computed(() => favoriteItems.value.length > 0)

  // Filtered items by type
  const filteredItems = computed(() => {
    if (!filters.value.type)
      return items.value
    return items.value.filter(item => item.type === filters.value.type)
  })

  // Actions
  function setItems(newItems: ContentListItem[]) {
    items.value = newItems
  }

  function setRecentItems(newItems: ContentListItem[]) {
    recentItems.value = newItems
  }

  function setFavoriteItems(newItems: ContentListItem[]) {
    favoriteItems.value = newItems
  }

  function addItem(item: ContentListItem) {
    items.value.unshift(item)
    pagination.value.total += 1
  }

  function updateItem(id: number, updates: Partial<ContentListItem>) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...updates }
    }

    const recentIndex = recentItems.value.findIndex(item => item.id === id)
    if (recentIndex !== -1) {
      recentItems.value[recentIndex] = { ...recentItems.value[recentIndex], ...updates }
    }

    const favIndex = favoriteItems.value.findIndex(item => item.id === id)
    if (favIndex !== -1) {
      favoriteItems.value[favIndex] = { ...favoriteItems.value[favIndex], ...updates }
    }
  }

  function toggleFavorite(id: number) {
    const item = items.value.find(item => item.id === id)
    if (item) {
      item.isFavorite = !item.isFavorite
      if (item.isFavorite) {
        if (!favoriteItems.value.find(f => f.id === id)) {
          favoriteItems.value.unshift(item)
        }
      }
      else {
        favoriteItems.value = favoriteItems.value.filter(f => f.id !== id)
      }
    }

    const recentItem = recentItems.value.find(item => item.id === id)
    if (recentItem) {
      recentItem.isFavorite = !recentItem.isFavorite
    }
  }

  function removeItem(id: number) {
    items.value = items.value.filter(item => item.id !== id)
    recentItems.value = recentItems.value.filter(item => item.id !== id)
    favoriteItems.value = favoriteItems.value.filter(item => item.id !== id)
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

  function clearTypeFilter() {
    filters.value.type = undefined
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(err: string | null) {
    error.value = err
  }

  function reset() {
    items.value = []
    recentItems.value = []
    favoriteItems.value = []
    isLoading.value = false
    error.value = null
    pagination.value = { page: 1, limit: 20, total: 0, totalPages: 0 }
    filters.value = { type: undefined, status: undefined, search: '' }
  }

  return {
    // State
    items,
    recentItems,
    favoriteItems,
    isLoading,
    error,
    pagination,
    filters,
    // Getters
    hasItems,
    isEmpty,
    hasNextPage,
    hasPreviousPage,
    hasRecent,
    hasFavorites,
    filteredItems,
    // Actions
    setItems,
    setRecentItems,
    setFavoriteItems,
    addItem,
    updateItem,
    toggleFavorite,
    removeItem,
    setPagination,
    setFilters,
    clearTypeFilter,
    setLoading,
    setError,
    reset,
  }
})
