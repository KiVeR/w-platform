export function useVersionHistory(explicitConfig?: EditorConfig) {
  const store = useVersionHistoryStore()
  const editorStore = useEditorStore()
  const contentStore = useContentStore()

  // inject() must run at setup time (not inside event handlers).
  // In child components, inject() resolves the provided config normally.
  // In the layout that calls provideEditorConfig() itself, inject() returns
  // undefined (same-component provide/inject limitation), so the caller can
  // pass the config explicitly via the `explicitConfig` parameter.
  const injectedConfig = inject(EDITOR_CONFIG_KEY, undefined)
  const config = explicitConfig ?? injectedConfig

  // Initialize the store's API client at setup time.
  // useContentVersionApi() → useEditorApi() → useEditorConfig() → inject(), so it
  // only works when called from a CHILD of the component that did provideEditorConfig().
  // In the layout itself (same component), injectedConfig is undefined — but the
  // layout doesn't call store API actions directly.
  if (injectedConfig) {
    store.setApi(useContentVersionApi())
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

    config?.onNavigateToHistory?.(contentId)
  }

  /**
   * Navigate back to editor
   */
  function navigateToEditor(): void {
    const contentId = contentStore.id
    if (!contentId)
      return

    config?.onNavigateToEditor?.(contentId)
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
