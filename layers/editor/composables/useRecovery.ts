import type { DesignDocument } from '@/types/widget'

export interface RecoveryData {
  design: DesignDocument
  savedAt: string
  widgetCount: number
}

export function useRecovery() {
  const editorStore = useEditorStore()
  const widgetsStore = useWidgetsStore()
  const contentStore = useContentStore()

  const showRecoveryModal = ref(false)
  const recoveryData = ref<RecoveryData | null>(null)

  function checkForRecovery(contentId: number, serverLastModified: string | null): boolean {
    const backup = localStorageService.loadBackup(contentId)

    if (!backup)
      return false

    if (localStorageService.hasNewerBackup(contentId, serverLastModified)) {
      recoveryData.value = {
        design: backup.design,
        savedAt: backup.meta.savedAt,
        widgetCount: backup.meta.widgetCount,
      }
      showRecoveryModal.value = true
      return true
    }

    localStorageService.clearBackup(contentId)
    return false
  }

  function restoreBackup(): void {
    if (!recoveryData.value)
      return

    editorStore.setDesign(recoveryData.value.design)
    widgetsStore.setWidgets(recoveryData.value.design.widgets)
    editorStore.markAsDirty()

    showRecoveryModal.value = false
    recoveryData.value = null
  }

  function discardBackup(): void {
    const id = contentStore.id
    if (id) {
      localStorageService.clearBackup(id)
    }

    showRecoveryModal.value = false
    recoveryData.value = null
  }

  return {
    showRecoveryModal,
    recoveryData,
    checkForRecovery,
    restoreBackup,
    discardBackup,
  }
}
