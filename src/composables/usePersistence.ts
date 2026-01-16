import type { DesignDocument } from '@/types/widget'
import { ref } from 'vue'
import { api } from '@/services/api'
import { localStorageService } from '@/services/persistence/localStorage'
import { useEditorStore } from '@/stores/editor'
import { useWidgetsStore } from '@/stores/widgets'
import { useAutoSave } from './useAutoSave'
import { useRecovery } from './useRecovery'

function createDefaultDesign(): DesignDocument {
  return {
    version: '1.0',
    globalStyles: {
      palette: 'turquoise',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
    },
    widgets: [],
  }
}

export function usePersistence() {
  const editorStore = useEditorStore()
  const widgetsStore = useWidgetsStore()

  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  const autoSave = useAutoSave()
  const recovery = useRecovery()

  async function loadDesign(id: number): Promise<boolean> {
    isLoading.value = true
    loadError.value = null
    editorStore.setLandingPageId(id)

    try {
      const serverData = await api.loadDesign(id)

      if (!serverData) {
        throw new Error('Design non trouvé')
      }

      const hasRecovery = recovery.checkForRecovery(
        id,
        serverData.lastModified,
      )

      if (!hasRecovery) {
        editorStore.setDesign(serverData.design)
        widgetsStore.setWidgets(serverData.design.widgets)
      }

      isLoading.value = false
      return true
    }
    catch {
      const backup = localStorageService.loadBackup(id)

      if (backup) {
        editorStore.setDesign(backup.design)
        widgetsStore.setWidgets(backup.design.widgets)
        loadError.value = 'Chargé depuis le cache local (serveur indisponible)'
      }
      else {
        const emptyDesign = createDefaultDesign()
        editorStore.setDesign(emptyDesign)
        widgetsStore.setWidgets([])
        loadError.value = 'Nouvelle page (serveur indisponible)'
      }

      isLoading.value = false
      return true
    }
  }

  function getCurrentDocument(): DesignDocument {
    return {
      version: editorStore.design.version,
      globalStyles: editorStore.design.globalStyles,
      widgets: widgetsStore.items,
    }
  }

  function setupBeforeUnloadGuard(): void {
    window.addEventListener('beforeunload', (event) => {
      if (editorStore.isDirty) {
        const id = editorStore.landingPageId
        if (id) {
          localStorageService.saveBackup(id, getCurrentDocument(), true)
        }

        event.preventDefault()
        event.returnValue = ''
      }
    })
  }

  return {
    isLoading,
    loadError,

    saveStatus: autoSave.saveStatus,
    lastError: autoSave.lastError,
    lastSyncedAt: autoSave.lastSyncedAt,
    saveNow: autoSave.saveNow,

    showRecoveryModal: recovery.showRecoveryModal,
    recoveryData: recovery.recoveryData,
    restoreBackup: recovery.restoreBackup,
    discardBackup: recovery.discardBackup,

    loadDesign,
    setupBeforeUnloadGuard,
  }
}
