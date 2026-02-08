import { ICON_CATEGORIES, POPULAR_ICONS } from '#shared/constants/lucide-categories'

export function useIconSearch() {
  const searchQuery = ref('')
  const activeCategory = ref<string | null>(null)
  const iconCache = new Map<string, Component | null>()

  const allCategories = computed(() => [
    { id: null, label: 'Populaires', count: POPULAR_ICONS.length },
    ...ICON_CATEGORIES.map(cat => ({
      id: cat.id,
      label: cat.label,
      count: cat.icons.length,
    })),
  ])

  const activeCategoryLabel = computed(() => {
    if (activeCategory.value === null) {
      return 'Populaires'
    }
    const cat = ICON_CATEGORIES.find(c => c.id === activeCategory.value)
    return cat?.label || 'Populaires'
  })

  const isSearching = computed(() => searchQuery.value.length >= 2)

  const searchResults = computed(() => {
    if (!searchQuery.value || searchQuery.value.length < 2) {
      return []
    }
    return searchIcons(searchQuery.value, 50)
  })

  const displayedIcons = computed(() => {
    if (searchQuery.value.length >= 2) {
      return searchResults.value
    }
    if (activeCategory.value) {
      const category = ICON_CATEGORIES.find(c => c.id === activeCategory.value)
      return category?.icons || []
    }
    return [...POPULAR_ICONS]
  })

  function getCachedIcon(name: string): Component | null {
    if (!iconCache.has(name)) {
      iconCache.set(name, getLucideIcon(name))
    }
    return iconCache.get(name) || null
  }

  function selectCategory(categoryId: string | null) {
    activeCategory.value = categoryId
    searchQuery.value = ''
  }

  function clearSearch() {
    searchQuery.value = ''
  }

  function resetState() {
    searchQuery.value = ''
    activeCategory.value = null
  }

  // Reset category when searching
  watch(searchQuery, (val) => {
    if (val.length >= 2) {
      activeCategory.value = null
    }
  })

  return {
    searchQuery,
    activeCategory,
    allCategories,
    activeCategoryLabel,
    isSearching,
    displayedIcons,
    searchResults,
    getCachedIcon,
    selectCategory,
    clearSearch,
    resetState,
  }
}
