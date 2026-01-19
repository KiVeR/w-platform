import { navigateTo } from '#app'
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
   * Get the content type slug for URLs
   */
  function getTypeSlug(): string {
    if (contentStore.type === 'landing-page')
      return 'lp'
    return contentStore.type ?? 'lp'
  }

  /**
   * Navigate to history page
   */
  async function navigateToHistory(): Promise<void> {
    const campaignId = contentStore.campaignId
    const contentId = contentStore.id

    if (!campaignId || !contentId)
      return

    const typeSlug = getTypeSlug()
    navigateTo(`/campaigns/${campaignId}/${typeSlug}/${contentId}/history`)
  }

  /**
   * Navigate back to editor
   */
  function navigateToEditor(): void {
    const campaignId = contentStore.campaignId
    const contentId = contentStore.id

    if (!campaignId || !contentId)
      return

    const typeSlug = getTypeSlug()
    navigateTo(`/campaigns/${campaignId}/${typeSlug}/${contentId}`)
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
