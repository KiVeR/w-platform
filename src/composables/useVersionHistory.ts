import { navigateTo } from '#app'
import { getContentTypeSlug } from '#shared/utils/content'
import { storeToRefs } from 'pinia'
import { useContentStore } from '@/stores/content'
import { useEditorStore } from '@/stores/editor'
import { useVersionHistoryStore } from '@/stores/versionHistory'

export function useVersionHistory() {
  const store = useVersionHistoryStore()
  const editorStore = useEditorStore()
  const contentStore = useContentStore()

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
  async function navigateToHistory(): Promise<void> {
    const contentId = contentStore.id
    const type = contentStore.type

    if (!contentId || !type)
      return

    navigateTo(`/${getContentTypeSlug(type)}/${contentId}/history`)
  }

  /**
   * Navigate back to editor
   */
  function navigateToEditor(): void {
    const contentId = contentStore.id
    const type = contentStore.type

    if (!contentId || !type)
      return

    navigateTo(`/${getContentTypeSlug(type)}/${contentId}`)
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
