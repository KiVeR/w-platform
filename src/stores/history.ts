import type { DesignDocument } from '@/types/widget'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const MAX_HISTORY = 50

export const useHistoryStore = defineStore('history', () => {
  // State
  const past = ref<DesignDocument[]>([])
  const future = ref<DesignDocument[]>([])

  // Getters
  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)
  const historyLength = computed(() => past.value.length)

  // Actions
  function pushState(design: DesignDocument) {
    // Clone the design to avoid reference issues
    const snapshot = JSON.parse(JSON.stringify(design))
    past.value.push(snapshot)

    // Limit history size
    if (past.value.length > MAX_HISTORY) {
      past.value.shift()
    }

    // Clear future on new action
    future.value = []
  }

  function undo(): DesignDocument | null {
    if (!canUndo.value)
      return null

    const previous = past.value.pop()
    if (previous) {
      return previous
    }
    return null
  }

  function redo(): DesignDocument | null {
    if (!canRedo.value)
      return null

    const next = future.value.pop()
    if (next) {
      return next
    }
    return null
  }

  function pushToFuture(design: DesignDocument) {
    const snapshot = JSON.parse(JSON.stringify(design))
    future.value.push(snapshot)
  }

  function clear() {
    past.value = []
    future.value = []
  }

  return {
    // State
    past,
    future,
    // Getters
    canUndo,
    canRedo,
    historyLength,
    // Actions
    pushState,
    undo,
    redo,
    pushToFuture,
    clear,
  }
})
