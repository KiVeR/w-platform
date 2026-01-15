<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import EditorLayout from '@/components/layout/EditorLayout.vue'
import { useHistoryStore } from '@/stores/history'
import { useEditorStore } from '@/stores/editor'
import { useWidgetsStore } from '@/stores/widgets'
import { useSelectionStore } from '@/stores/selection'

const historyStore = useHistoryStore()
const editorStore = useEditorStore()
const widgetsStore = useWidgetsStore()
const selectionStore = useSelectionStore()

// Keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  // Undo: Ctrl/Cmd + Z
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    const previous = historyStore.undo()
    if (previous) {
      historyStore.pushToFuture(editorStore.design)
      editorStore.setDesign(previous)
      widgetsStore.setWidgets(previous.widgets)
    }
  }

  // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
  if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
    event.preventDefault()
    const next = historyStore.redo()
    if (next) {
      historyStore.pushState(editorStore.design)
      editorStore.setDesign(next)
      widgetsStore.setWidgets(next.widgets)
    }
  }

  // Delete selected widget: Delete or Backspace
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectionStore.selectedId) {
    // Only if not in an input field
    const target = event.target as HTMLElement
    if (!['INPUT', 'TEXTAREA'].includes(target.tagName)) {
      event.preventDefault()
      widgetsStore.removeWidget(selectionStore.selectedId)
      selectionStore.deselect()
    }
  }

  // Navigate widgets: Arrow Up/Down
  if (event.key === 'ArrowUp' && !event.ctrlKey && !event.metaKey) {
    const target = event.target as HTMLElement
    if (!['INPUT', 'TEXTAREA'].includes(target.tagName)) {
      event.preventDefault()
      selectionStore.selectPrevious()
    }
  }
  if (event.key === 'ArrowDown' && !event.ctrlKey && !event.metaKey) {
    const target = event.target as HTMLElement
    if (!['INPUT', 'TEXTAREA'].includes(target.tagName)) {
      event.preventDefault()
      selectionStore.selectNext()
    }
  }

  // Escape: Deselect
  if (event.key === 'Escape') {
    selectionStore.deselect()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <EditorLayout />
</template>
