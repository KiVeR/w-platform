import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the API
vi.mock('@/services/api', () => ({
  api: {
    getVersions: vi.fn(),
    getVersion: vi.fn(),
    restoreVersion: vi.fn(),
  },
}))

// Mock the UI store
vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    isHistoryMode: false,
    enterHistoryMode: vi.fn(),
    exitHistoryMode: vi.fn(),
  })),
}))

describe('useVersionHistory', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('loadVersions', () => {
    it('fetches versions from API', async () => {
      const mockVersions = {
        data: [
          { id: 1, version: '1.0', widgetCount: 5, createdAt: '2026-01-01', isLatest: true },
          { id: 2, version: '0.9', widgetCount: 4, createdAt: '2025-12-15', isLatest: false },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      }

      const { api } = await import('@/services/api')
      vi.mocked(api.getVersions).mockResolvedValue(mockVersions)

      const { useVersionHistory } = await import('@/composables/useVersionHistory')
      const { versions, loadVersions, hasMore, total } = useVersionHistory()

      await loadVersions(1)

      expect(api.getVersions).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 10,
        sortOrder: 'desc',
      })
      expect(versions.value).toEqual(mockVersions.data)
      expect(total.value).toBe(2)
      expect(hasMore.value).toBe(false)
    })

    it('sets hasMore when more pages available', async () => {
      const mockVersions = {
        data: [{ id: 1, version: '1.0', widgetCount: 5, createdAt: '2026-01-01', isLatest: true }],
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      }

      const { api } = await import('@/services/api')
      vi.mocked(api.getVersions).mockResolvedValue(mockVersions)

      const { useVersionHistory } = await import('@/composables/useVersionHistory')
      const { loadVersions, hasMore } = useVersionHistory()

      await loadVersions(1)

      expect(hasMore.value).toBe(true)
    })
  })

  describe('selectVersion', () => {
    it('fetches version detail with design', async () => {
      const mockVersionDetail = {
        id: 1,
        version: '1.0',
        widgetCount: 5,
        createdAt: '2026-01-01',
        isLatest: true,
        design: { globalStyles: {}, widgets: [] },
      }

      const { api } = await import('@/services/api')
      vi.mocked(api.getVersion).mockResolvedValue(mockVersionDetail)

      const { useVersionHistory } = await import('@/composables/useVersionHistory')
      const { selectedVersion, selectVersion, clearCache } = useVersionHistory()

      // Clear cache before test
      clearCache()

      // Mock editor store to have a landingPageId
      const { useEditorStore } = await import('@/stores/editor')
      const editorStore = useEditorStore()
      editorStore.landingPageId = 1

      await selectVersion(1)

      expect(api.getVersion).toHaveBeenCalledWith(1, 1)
      expect(selectedVersion.value).toEqual(mockVersionDetail)
    })
  })
})
