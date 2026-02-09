import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { createVersionsResponse } from '../../helpers/factories'
import { stubContentVersionApi, stubEditorApi, stubEditorConfig } from '../../helpers/stubs'

// Stub auto-imported composables/stores used by the versionHistory store.
vi.stubGlobal('defineStore', (await import('pinia')).defineStore)
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

const versionApi = stubContentVersionApi()
stubEditorConfig()
stubEditorApi()

const mockEditorStore = {
  isDirty: false,
  setDesign: vi.fn(),
  markAsSaved: vi.fn(),
}
vi.stubGlobal('useEditorStore', () => mockEditorStore)

const mockWidgetsStore = { setWidgets: vi.fn() }
vi.stubGlobal('useWidgetsStore', () => mockWidgetsStore)

const mockUIStore = {
  isHistoryMode: false,
  enterHistoryMode: vi.fn(),
  exitHistoryMode: vi.fn(),
}
vi.stubGlobal('useUIStore', () => mockUIStore)

const { useContentStore } = await import('~~/layers/editor/stores/content')
vi.stubGlobal('useContentStore', useContentStore)

const { useVersionHistoryStore } = await import('~~/layers/editor/stores/versionHistory')

function createStore() {
  const store = useVersionHistoryStore()
  store.setApi(versionApi)
  return store
}

describe('useVersionHistory', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('loadVersions', () => {
    it('fetches versions from API via store', async () => {
      const mockResponse = createVersionsResponse()

      versionApi.getVersions.mockResolvedValue(mockResponse)

      const contentStore = useContentStore()
      contentStore.id = 1

      const store = createStore()
      await store.loadVersions()

      expect(versionApi.getVersions).toHaveBeenCalledWith(1, expect.objectContaining({ page: 1 }))
      expect(store.versions).toEqual(mockResponse.versions)
      expect(store.total).toBe(2)
    })
  })

  describe('selectVersion', () => {
    it('fetches version detail with design', async () => {
      const mockVersionDetail = {
        id: 1,
        version: '1.0',
        widgetCount: 5,
        createdAt: '2026-01-01',
        isCurrent: true,
        design: { globalStyles: {}, widgets: [] },
      }

      versionApi.getVersion.mockResolvedValue(mockVersionDetail)

      const contentStore = useContentStore()
      contentStore.id = 1

      const store = createStore()
      await store.selectVersion(1)

      expect(versionApi.getVersion).toHaveBeenCalledWith(1, 1)
      expect(store.selectedVersion).toEqual(mockVersionDetail)
    })
  })
})
