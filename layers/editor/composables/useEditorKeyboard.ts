/**
 * Composable for handling editor keyboard shortcuts.
 * Only active in designer mode.
 */
export function useEditorKeyboard() {
  const selectionStore = useSelectionStore()
  const widgetsStore = useWidgetsStore()
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

  // Delete / Backspace - remove selected widget
  onKeyStroke(['Delete', 'Backspace'], (e) => {
    if (!isDesignerMode())
      return
    if (isInputFocused())
      return
    if (isModalOpen())
      return

    if (selectionStore.hasSelection) {
      e.preventDefault()
      const id = selectionStore.selectedId!
      widgetsStore.removeWidgetAnywhere(id)
      selectionStore.deselect()
    }
  })

  return {
    isInputFocused,
    isDesignerMode,
    isModalOpen,
  }
}
