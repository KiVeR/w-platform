import { storeToRefs } from 'pinia'

export function useVersionHistory() {
  const store = useVersionHistoryStore()
  const editorStore = useEditorStore()
  const contentStore = useContentStore()
  const config = useEditorConfig()

  const {
    versions,
    selectedVersion,
    isLoading,
    isLoadingVersion,
    isRestoring,
    isActive,
    hasMore,
    total,
    rateLimit,
  } = storeToRefs(store)

  /**
   * Navigate to history page
   */
  function navigateToHistory(): void {
    const contentId = contentStore.id
    if (!contentId)
      return

    config.onNavigateToHistory?.(contentId)
  }

  /**
   * Navigate back to editor
   */
  function navigateToEditor(): void {
    const contentId = contentStore.id
    if (!contentId)
      return

    config.onNavigateToEditor?.(contentId)
  }

  /**
   * Restore a version and navigate back to editor
   */
  async function restoreVersion(versionId: number): Promise<boolean> {
    const result = await store.restoreVersion(versionId)
    navigateToEditor()
    return result
  }

  /**
   * Check if user has unsaved changes before navigating
   * Returns true if safe to proceed, false if should cancel
   */
  function checkUnsavedChanges(): { canProceed: boolean, isDirty: boolean } {
    return {
      canProceed: !editorStore.isDirty,
      isDirty: editorStore.isDirty,
    }
  }

  return {
    // State
    versions,
    selectedVersion,
    isLoading,
    isLoadingVersion,
    isRestoring,
    isActive,
    hasMore,
    total,
    rateLimit,

    // Actions
    loadVersions: store.loadVersions,
    loadMore: store.loadMore,
    selectVersion: store.selectVersion,
    restoreVersion,
    enterHistoryMode: store.enterHistoryMode,
    exitHistoryMode: store.exitHistoryMode,
    navigateToHistory,
    navigateToEditor,
    clearCache: store.clearCache,
    checkUnsavedChanges,
  }
}
