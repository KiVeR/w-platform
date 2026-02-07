import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetVersions = vi.fn()
const mockGetVersion = vi.fn()
const mockRestoreVersion = vi.fn()

// Mock the composable used by the store
vi.mock('#imports', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>()
  return {
    ...original,
    useContentVersionApi: () => ({
      getVersions: mockGetVersions,
      getVersion: mockGetVersion,
      restoreVersion: mockRestoreVersion,
    }),
    useEditorConfig: () => ({
      apiBaseUrl: '/api/v1',
      getAuthToken: () => 'test-token',
    }),
    useEditorApi: () => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    }),
    useUIStore: vi.fn(() => ({
      isHistoryMode: false,
      enterHistoryMode: vi.fn(),
      exitHistoryMode: vi.fn(),
    })),
  }
})

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

      mockGetVersions.mockResolvedValue(mockResponse)

      const { useContentStore } = await import('@/stores/content')
      const contentStore = useContentStore()
      contentStore.id = 1

      const { useVersionHistoryStore } = await import('@/stores/versionHistory')
      const store = useVersionHistoryStore()

      await store.loadVersions()

      expect(mockGetVersions).toHaveBeenCalledWith(1, expect.objectContaining({ page: 1 }))
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

      mockGetVersion.mockResolvedValue(mockVersionDetail)

      const { useContentStore } = await import('@/stores/content')
      const contentStore = useContentStore()
      contentStore.id = 1

      const { useVersionHistoryStore } = await import('@/stores/versionHistory')
      const store = useVersionHistoryStore()

      await store.selectVersion(1)

      expect(mockGetVersion).toHaveBeenCalledWith(1, 1)
      expect(store.selectedVersion).toEqual(mockVersionDetail)
    })
  })
})
