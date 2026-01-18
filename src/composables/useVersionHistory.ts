import { navigateTo } from '#app'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useVersionHistoryStore } from '@/stores/versionHistory'

export function useVersionHistory() {
  const store = useVersionHistoryStore()
  const editorStore = useEditorStore()

  const {
    versions,
    selectedVersion,
    isLoading,
    isLoadingVersion,
    isRestoring,
    isActive,
    hasMore,
    total,
  } = storeToRefs(store)

  function navigateToHistory(): void {
    const landingPageId = editorStore.landingPageId
    if (landingPageId) {
      navigateTo(`/editor/${landingPageId}/history`)
    }
  }

  function navigateToEditor(): void {
    const landingPageId = editorStore.landingPageId
    if (landingPageId) {
      navigateTo(`/editor/${landingPageId}`)
    }
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
