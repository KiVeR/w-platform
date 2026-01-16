import type { ComputedRef, Ref } from 'vue'
import type { DesignDocument } from '@/types/widget'
import { useDebounceFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { api } from '@/services/api'
import { localStorageService } from '@/services/persistence/localStorage'
import { useEditorStore } from '@/stores/editor'
import { useWidgetsStore } from '@/stores/widgets'

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

export interface AutoSaveOptions {
  debounceMs?: number
  localSaveMs?: number
  enabled?: boolean
}

export interface AutoSaveReturn {
  saveStatus: Ref<SaveStatus>
  lastError: Ref<string | null>
  lastSyncedAt: Ref<Date | null>
  saveNow: () => Promise<boolean>
  saveToApi: () => void
  saveToLocal: () => void
  needsFirstSave: ComputedRef<boolean>
  createAndSave: (title: string) => Promise<{ success: boolean, id?: number }>
}

export function useAutoSave(options: AutoSaveOptions = {}): AutoSaveReturn {
  const {
    debounceMs = 3000,
    localSaveMs = 1000,
    enabled = true,
  } = options

  const editorStore = useEditorStore()
  const widgetsStore = useWidgetsStore()

  const saveStatus = ref<SaveStatus>('idle')
  const lastError = ref<string | null>(null)
  const lastSyncedAt = ref<Date | null>(null)

  const currentDocument = computed<DesignDocument>(() => ({
    version: editorStore.design.version,
    globalStyles: editorStore.design.globalStyles,
    widgets: widgetsStore.items,
  }))

  const saveToApi = useDebounceFn(async () => {
    const id = editorStore.landingPageId
    if (!id || !editorStore.isDirty)
      return

    saveStatus.value = 'saving'
    lastError.value = null

    try {
      const result = await api.saveDesign(id, currentDocument.value)

      if (result) {
        editorStore.markAsSaved()
        localStorageService.clearBackup(id)
        lastSyncedAt.value = new Date()
        saveStatus.value = 'saved'

        setTimeout(() => {
          if (saveStatus.value === 'saved') {
            saveStatus.value = 'idle'
          }
        }, 2000)
      }
      else {
        throw new Error('Echec de la sauvegarde')
      }
    }
    catch (error) {
      lastError.value = error instanceof Error ? error.message : 'Erreur inconnue'
      saveStatus.value = 'error'

      setTimeout(() => {
        if (saveStatus.value === 'error') {
          saveStatus.value = 'idle'
        }
      }, 3000)
    }
  }, debounceMs)

  const saveToLocal = useDebounceFn(() => {
    const id = editorStore.landingPageId
    if (!id)
      return

    localStorageService.saveBackup(id, currentDocument.value, editorStore.isDirty)
  }, localSaveMs)

  watch(
    () => [editorStore.isDirty, widgetsStore.items],
    () => {
      if (!enabled || !editorStore.landingPageId)
        return

      if (editorStore.isDirty) {
        saveStatus.value = 'pending'
        saveToLocal()
        saveToApi()
      }
    },
    { deep: true },
  )

  async function saveNow(): Promise<boolean> {
    const id = editorStore.landingPageId
    if (!id)
      return false

    saveStatus.value = 'saving'

    try {
      const result = await api.saveDesign(id, currentDocument.value)

      if (result) {
        editorStore.markAsSaved()
        localStorageService.clearBackup(id)
        lastSyncedAt.value = new Date()
        saveStatus.value = 'saved'
        return true
      }
      throw new Error('Echec sauvegarde')
    }
    catch (error) {
      lastError.value = error instanceof Error ? error.message : 'Erreur'
      saveStatus.value = 'error'
      return false
    }
  }

  const needsFirstSave = computed(() => editorStore.landingPageId === null)

  async function createAndSave(title: string): Promise<{ success: boolean, id?: number }> {
    saveStatus.value = 'saving'
    lastError.value = null

    try {
      const created = await api.createLandingPage({ title })
      if (!created) {
        throw new Error('Echec de la création')
      }

      editorStore.setLandingPageId(created.id)

      const result = await api.saveDesign(created.id, currentDocument.value)
      if (!result) {
        throw new Error('Echec de la sauvegarde du design')
      }

      editorStore.markAsSaved()
      lastSyncedAt.value = new Date()
      saveStatus.value = 'saved'

      return { success: true, id: created.id }
    }
    catch (error) {
      lastError.value = error instanceof Error ? error.message : 'Erreur inconnue'
      saveStatus.value = 'error'
      return { success: false }
    }
  }

  return {
    saveStatus,
    lastError,
    lastSyncedAt,
    saveNow,
    saveToApi,
    saveToLocal,
    needsFirstSave,
    createAndSave,
  }
}
