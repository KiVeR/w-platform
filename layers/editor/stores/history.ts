import type { DesignDocument } from '../types/widget'

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
    const snapshot = structuredClone(design)
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

    return past.value.pop() ?? null
  }

  function redo(): DesignDocument | null {
    if (!canRedo.value)
      return null

    return future.value.pop() ?? null
  }

  function pushToFuture(design: DesignDocument) {
    const snapshot = structuredClone(design)
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
