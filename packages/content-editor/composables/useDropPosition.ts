interface DropPositionReturn {
  dropIndex: Ref<number | null>
  indicatorY: Ref<number>
  isActive: Ref<boolean>
  handleDragOver: (event: DragEvent, containerEl: HTMLElement, childSelector: string) => void
  handleDragLeave: (event: DragEvent, containerEl: HTMLElement) => void
  reset: () => void
}

/**
 * Calculates insertion index and drop indicator position based on cursor Y
 * during a palette drag operation.
 */
export function useDropPosition(): DropPositionReturn {
  const widgetsStore = useWidgetsStore()

  const dropIndex = ref<number | null>(null)
  const indicatorY = ref(0)
  const isActive = ref(false)

  // Auto-reset when drag ends (covers drop, cancel, leave window)
  watch(() => widgetsStore.draggedWidgetType, (type) => {
    if (!type)
      reset()
  })

  function handleDragOver(event: DragEvent, containerEl: HTMLElement, childSelector: string): void {
    if (!widgetsStore.draggedWidgetType)
      return

    event.preventDefault()
    isActive.value = true

    const children = Array.from(containerEl.querySelectorAll(childSelector)) as HTMLElement[]
    const containerRect = containerEl.getBoundingClientRect()

    if (children.length === 0) {
      dropIndex.value = 0
      indicatorY.value = 0
      return
    }

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child)
        continue

      const rect = child.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2

      if (event.clientY < midpoint) {
        dropIndex.value = i
        indicatorY.value = rect.top - containerRect.top
        return
      }
    }

    const lastChild = children.at(-1)
    if (!lastChild)
      return

    const lastRect = lastChild.getBoundingClientRect()
    dropIndex.value = children.length
    indicatorY.value = lastRect.bottom - containerRect.top
  }

  function handleDragLeave(event: DragEvent, containerEl: HTMLElement): void {
    const related = event.relatedTarget as HTMLElement | null
    if (!related || !containerEl.contains(related)) {
      reset()
    }
  }

  function reset(): void {
    dropIndex.value = null
    indicatorY.value = 0
    isActive.value = false
  }

  return {
    dropIndex,
    indicatorY,
    isActive,
    handleDragOver,
    handleDragLeave,
    reset,
  }
}
