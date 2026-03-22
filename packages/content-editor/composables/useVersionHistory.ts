export function useVersionHistory(explicitConfig?: EditorConfig) {
  const store = useVersionHistoryStore()
  const contentStore = useContentStore()

  // Layout provides config in the same component, so inject() misses it — accept explicit fallback.
  const injectedConfig = inject(EDITOR_CONFIG_KEY, undefined)
  const config = explicitConfig ?? injectedConfig

  // Wire API client at setup time (inject() chain only works in child components).
  if (injectedConfig?.versionAdapter) {
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

  function navigateToHistory(): void {
    const contentId = contentStore.id
    if (!contentId)
      return

    config?.onNavigateToHistory?.(contentId)
  }

  function navigateToEditor(): void {
    const contentId = contentStore.id
    if (!contentId)
      return

    config?.onNavigateToEditor?.(contentId)
  }

  async function restoreVersion(versionId: number): Promise<boolean> {
    const result = await store.restoreVersion(versionId)
    navigateToEditor()
    return result
  }

  return {
    versions,
    selectedVersion,
    isLoading,
    isLoadingVersion,
    isRestoring,
    isActive,
    hasMore,
    total,
    rateLimit,
    loadVersions: store.loadVersions,
    loadMore: store.loadMore,
    selectVersion: store.selectVersion,
    restoreVersion,
    enterHistoryMode: store.enterHistoryMode,
    exitHistoryMode: store.exitHistoryMode,
    navigateToHistory,
    navigateToEditor,
    clearCache: store.clearCache,
  }
}
