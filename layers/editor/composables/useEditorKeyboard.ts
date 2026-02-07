import { onKeyStroke } from '@vueuse/core'

/**
 * Composable for handling editor keyboard shortcuts.
 * Only active in designer mode.
 */
export function useEditorKeyboard() {
  const selectionStore = useSelectionStore()
  const uiStore = useUIStore()

  function isInputFocused(): boolean {
    const activeElement = document.activeElement
    if (!activeElement)
      return false

    const tagName = activeElement.tagName.toLowerCase()
    const isEditable = activeElement.hasAttribute('contenteditable')
    const isInput = ['input', 'textarea', 'select'].includes(tagName)

    return isInput || isEditable
  }

  function isDesignerMode(): boolean {
    return uiStore.mode === 'designer'
  }

  function isModalOpen(): boolean {
    return document.querySelector('[role="dialog"]') !== null
  }

  // Escape key - deselect widget
  onKeyStroke('Escape', (e) => {
    if (!isDesignerMode())
      return
    if (isInputFocused())
      return
    if (isModalOpen())
      return

    if (selectionStore.hasSelection) {
      e.preventDefault()
      selectionStore.deselect()
    }
  })

  return {
    isInputFocused,
    isDesignerMode,
    isModalOpen,
  }
}
