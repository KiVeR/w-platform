import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the API used by the store
vi.mock('@/services/api/contentVersionApi', () => ({
  contentVersionApi: {
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
    it('fetches versions from API via store', async () => {
      const mockResponse = {
        versions: [
          { id: 1, version: '1.0', widgetCount: 5, createdAt: '2026-01-01', isCurrent: true },
          { id: 2, version: '0.9', widgetCount: 4, createdAt: '2025-12-15', isCurrent: false },
        ],
        pagination: { total: 2, page: 1, pageSize: 10, totalPages: 1 },
        rateLimit: { remaining: 10, limit: 10, resetAt: '2026-01-01T00:00:00Z' },
      }

      const { contentVersionApi } = await import('@/services/api/contentVersionApi')
      vi.mocked(contentVersionApi.getVersions).mockResolvedValue(mockResponse)

      // Set up content store with an ID
      const { useContentStore } = await import('@/stores/content')
      const contentStore = useContentStore()
      contentStore.id = 1

      const { useVersionHistoryStore } = await import('@/stores/versionHistory')
      const store = useVersionHistoryStore()

      await store.loadVersions()

      expect(contentVersionApi.getVersions).toHaveBeenCalledWith(1, expect.objectContaining({ page: 1 }))
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

      const { contentVersionApi } = await import('@/services/api/contentVersionApi')
      vi.mocked(contentVersionApi.getVersion).mockResolvedValue(mockVersionDetail)

      const { useContentStore } = await import('@/stores/content')
      const contentStore = useContentStore()
      contentStore.id = 1

      const { useVersionHistoryStore } = await import('@/stores/versionHistory')
      const store = useVersionHistoryStore()

      await store.selectVersion(1)

      expect(contentVersionApi.getVersion).toHaveBeenCalledWith(1, 1)
      expect(store.selectedVersion).toEqual(mockVersionDetail)
    })
  })
})
