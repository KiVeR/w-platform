export function useVersionHistory() {
  const store = useVersionHistoryStore()
  const editorStore = useEditorStore()
  const contentStore = useContentStore()

  // Lazy: useEditorConfig() uses inject() which cannot read a provide() from the
  // same component. The editor layout calls both provideEditorConfig() and
  // useVersionHistory(), so we defer the inject to first actual use.
  let _config: ReturnType<typeof useEditorConfig> | null = null
  function getConfig() {
    if (!_config) {
      _config = useEditorConfig()
    }
    return _config
  }

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

    getConfig().onNavigateToHistory?.(contentId)
  }

  /**
   * Navigate back to editor
   */
  function navigateToEditor(): void {
    const contentId = contentStore.id
    if (!contentId)
      return

    getConfig().onNavigateToEditor?.(contentId)
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
