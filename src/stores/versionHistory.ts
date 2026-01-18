import type { VersionDetail, VersionSummary } from '@/services/api/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/services/api'
import { useEditorStore } from '@/stores/editor'
import { useUIStore } from '@/stores/ui'
import { useWidgetsStore } from '@/stores/widgets'

const PAGE_SIZE = 10
const CACHE_MAX_SIZE = 5

export const useVersionHistoryStore = defineStore('versionHistory', () => {
  const editorStore = useEditorStore()
  const widgetsStore = useWidgetsStore()
  const uiStore = useUIStore()

  const versions = ref<VersionSummary[]>([])
  const selectedVersion = ref<VersionDetail | null>(null)
  const isLoading = ref(false)
  const isLoadingVersion = ref(false)
  const isRestoring = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(1)
  const total = ref(0)

  const versionCache = new Map<number, VersionDetail>()

  const isActive = computed(() => uiStore.isHistoryMode)

  async function loadVersions(landingPageId: number): Promise<void> {
    if (!landingPageId)
      return

    isLoading.value = true
    currentPage.value = 1
    versions.value = []

    try {
      const response = await api.getVersions(landingPageId, {
        page: 1,
        limit: PAGE_SIZE,
        sortOrder: 'desc',
      })

      if (response) {
        versions.value = response.data
        total.value = response.total
        hasMore.value = response.page < response.totalPages
      }
    }
    finally {
      isLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    const landingPageId = editorStore.landingPageId
    if (!landingPageId || isLoading.value || !hasMore.value)
      return

    isLoading.value = true
    currentPage.value++

    try {
      const response = await api.getVersions(landingPageId, {
        page: currentPage.value,
        limit: PAGE_SIZE,
        sortOrder: 'desc',
      })

      if (response) {
        versions.value = [...versions.value, ...response.data]
        hasMore.value = response.page < response.totalPages
      }
    }
    finally {
      isLoading.value = false
    }
  }

  async function selectVersion(versionId: number): Promise<void> {
    const landingPageId = editorStore.landingPageId
    if (!landingPageId)
      return

    if (versionCache.has(versionId)) {
      selectedVersion.value = versionCache.get(versionId)!
      return
    }

    isLoadingVersion.value = true

    try {
      const response = await api.getVersion(landingPageId, versionId)
      if (response) {
        if (versionCache.size >= CACHE_MAX_SIZE) {
          const firstKey = versionCache.keys().next().value
          if (firstKey !== undefined) {
            versionCache.delete(firstKey)
          }
        }
        versionCache.set(versionId, response)
        selectedVersion.value = response
      }
    }
    finally {
      isLoadingVersion.value = false
    }
  }

  async function restoreVersion(versionId: number): Promise<boolean> {
    const landingPageId = editorStore.landingPageId
    if (!landingPageId)
      return false

    isRestoring.value = true

    try {
      const response = await api.restoreVersion(landingPageId, versionId)

      if (response && selectedVersion.value) {
        editorStore.setDesign(selectedVersion.value.design)
        widgetsStore.setWidgets(selectedVersion.value.design.widgets)
        editorStore.markAsSaved()
        loadVersions(landingPageId)
        return true
      }

      console.error('Failed to restore version')
      return false
    }
    finally {
      isRestoring.value = false
      versionCache.clear()
      exitHistoryMode()
    }
  }

  async function enterHistoryMode(): Promise<void> {
    uiStore.enterHistoryMode()
    const landingPageId = editorStore.landingPageId
    if (landingPageId) {
      await loadVersions(landingPageId)
      if (versions.value.length > 0) {
        await selectVersion(versions.value[0].id)
      }
    }
  }

  function exitHistoryMode(): void {
    selectedVersion.value = null
    uiStore.exitHistoryMode()
  }

  function clearCache(): void {
    versionCache.clear()
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

    loadVersions,
    loadMore,
    selectVersion,
    restoreVersion,
    enterHistoryMode,
    exitHistoryMode,
    clearCache,
  }
})
