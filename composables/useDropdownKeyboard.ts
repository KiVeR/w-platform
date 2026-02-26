import { ref, type Ref } from 'vue'

export function useDropdownKeyboard<T>(
  items: Ref<T[]>,
  isOpen: Ref<boolean>,
  onSelect: (item: T) => void,
) {
  const highlightedIndex = ref(-1)

  /**
   * Handle keyboard navigation in dropdown.
   * Returns `true` if the event was handled, `false` otherwise.
   */
  function handleKeydown(event: KeyboardEvent): boolean {
    if (!isOpen.value || items.value.length === 0) return false

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, items.value.length - 1)
      return true
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      return true
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        onSelect(items.value[highlightedIndex.value])
      }
      return true
    }
    if (event.key === 'Escape') {
      isOpen.value = false
      return true
    }
    return false
  }

  function reset() {
    highlightedIndex.value = -1
  }

  function handleBlur() {
    setTimeout(() => { isOpen.value = false }, 200)
  }

  return { highlightedIndex, handleKeydown, reset, handleBlur }
}
