export const useSelectionStore = defineStore('selection', () => {
  const widgetsStore = useWidgetsStore()

  // State
  const selectedId = ref<string | null>(null)
  const hoveredId = ref<string | null>(null)

  // Getters
  const selectedWidget = computed(() => {
    if (!selectedId.value)
      return null
    return widgetsStore.findWidgetById(selectedId.value)
  })

  const hasSelection = computed(() => selectedId.value !== null)

  // Actions
  function select(id: string | null) {
    selectedId.value = id
  }

  function deselect() {
    selectedId.value = null
  }

  function setHovered(id: string | null) {
    hoveredId.value = id
  }

  function selectNext() {
    const items = widgetsStore.sortedItems
    if (items.length === 0)
      return

    if (!selectedId.value) {
      const first = items[0]
      if (first)
        selectedId.value = first.id
      return
    }

    const currentIndex = items.findIndex(w => w.id === selectedId.value)
    const nextIndex = (currentIndex + 1) % items.length
    const next = items[nextIndex]
    if (next)
      selectedId.value = next.id
  }

  function selectPrevious() {
    const items = widgetsStore.sortedItems
    if (items.length === 0)
      return

    if (!selectedId.value) {
      const last = items[items.length - 1]
      if (last)
        selectedId.value = last.id
      return
    }

    const currentIndex = items.findIndex(w => w.id === selectedId.value)
    const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
    const prev = items[prevIndex]
    if (prev)
      selectedId.value = prev.id
  }

  return {
    // State
    selectedId,
    hoveredId,
    // Getters
    selectedWidget,
    hasSelection,
    // Actions
    select,
    deselect,
    setHovered,
    selectNext,
    selectPrevious,
  }
})
