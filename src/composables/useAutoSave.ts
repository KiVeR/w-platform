import type { ComputedRef, Ref } from 'vue'
import type { DesignDocument } from '@/types/widget'
import { useDebounceFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { contentApi } from '@/services/api/contentApi'
import { localStorageService } from '@/services/persistence/localStorage'
import { useContentStore } from '@/stores/content'
import { useEditorStore } from '@/stores/editor'
import { useUIStore } from '@/stores/ui'
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
  const uiStore = useUIStore()
  const contentStore = useContentStore()

  const saveStatus = ref<SaveStatus>('idle')
  const lastError = ref<string | null>(null)
  const lastSyncedAt = ref<Date | null>(null)

  const currentDocument = computed<DesignDocument>(() => ({
    version: editorStore.design.version,
    globalStyles: editorStore.design.globalStyles,
    widgets: widgetsStore.items,
  }))

  const isInCampaignContext = computed(() => uiStore.currentCampaignId !== null)
  const hasContentId = computed(() => contentStore.id !== null)

  const saveToApi = useDebounceFn(async () => {
    if (!editorStore.isDirty)
      return

    if (!isInCampaignContext.value || !hasContentId.value)
      return

    const campaignId = uiStore.currentCampaignId!
    const contentId = contentStore.id!

    saveStatus.value = 'saving'
    lastError.value = null

    try {
      const result = await contentApi.saveDesign(campaignId, contentId, currentDocument.value)

      if (result) {
        editorStore.markAsSaved()
        localStorageService.clearBackup(contentId)
        lastSyncedAt.value = new Date()
        saveStatus.value = 'saved'

        setTimeout(() => {
          if (saveStatus.value === 'saved') {
            saveStatus.value = 'idle'
          }
        }, 2000)
      }
      else {
        throw new Error('Échec de la sauvegarde')
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
    const id = contentStore.id
    if (!id)
      return

    localStorageService.saveBackup(id, currentDocument.value, editorStore.isDirty)
  }, localSaveMs)

  watch(
    () => [editorStore.isDirty, widgetsStore.items],
    () => {
      if (!enabled || !isInCampaignContext.value || !hasContentId.value)
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
    if (!isInCampaignContext.value || !hasContentId.value)
      return false

    const campaignId = uiStore.currentCampaignId!
    const contentId = contentStore.id!

    saveStatus.value = 'saving'

    try {
      const result = await contentApi.saveDesign(campaignId, contentId, currentDocument.value)

      if (result) {
        editorStore.markAsSaved()
        localStorageService.clearBackup(contentId)
        lastSyncedAt.value = new Date()
        saveStatus.value = 'saved'
        return true
      }
      throw new Error('Échec de la sauvegarde')
    }
    catch (error) {
      lastError.value = error instanceof Error ? error.message : 'Erreur inconnue'
      saveStatus.value = 'error'
      return false
    }
  }

  const needsFirstSave = computed(() => !hasContentId.value)

  async function createAndSave(title: string): Promise<{ success: boolean, id?: number }> {
    if (!isInCampaignContext.value)
      return { success: false }

    saveStatus.value = 'saving'
    lastError.value = null

    const campaignId = uiStore.currentCampaignId!

    try {
      const created = await contentApi.createContent(campaignId, {
        type: 'landing-page',
        title,
      })

      if (!created) {
        throw new Error('Échec de la création du contenu')
      }

      // Update content store
      contentStore.setMetadata({
        id: created.id,
        type: 'landing-page',
        campaignId: created.campaignId,
        title: created.title,
      })

      // Save design
      const result = await contentApi.saveDesign(campaignId, created.id, currentDocument.value)
      if (!result) {
        throw new Error('Échec de la sauvegarde du design')
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
