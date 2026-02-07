import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

const mockGetVersions = vi.fn()
const mockGetVersion = vi.fn()
const mockRestoreVersion = vi.fn()

// Stub auto-imported composables/stores used by the versionHistory store.
// In Nuxt runtime these are auto-imported; in Vitest they must be globals.
vi.stubGlobal('defineStore', (await import('pinia')).defineStore)

vi.stubGlobal('useContentVersionApi', () => ({
  getVersions: mockGetVersions,
  getVersion: mockGetVersion,
  restoreVersion: mockRestoreVersion,
}))

vi.stubGlobal('useEditorConfig', () => ({
  apiBaseUrl: '/api/v1',
  getAuthToken: () => 'test-token',
}))

vi.stubGlobal('useEditorApi', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

// Stub Vue APIs that stores use without import
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

// Stub Pinia stores used by versionHistory store
const mockEditorStore = {
  isDirty: false,
  setDesign: vi.fn(),
  markAsSaved: vi.fn(),
}
vi.stubGlobal('useEditorStore', () => mockEditorStore)

const mockWidgetsStore = {
  setWidgets: vi.fn(),
}
vi.stubGlobal('useWidgetsStore', () => mockWidgetsStore)

const mockUIStore = {
  isHistoryMode: false,
  enterHistoryMode: vi.fn(),
  exitHistoryMode: vi.fn(),
}
vi.stubGlobal('useUIStore', () => mockUIStore)

// Import content store first, then stub it as global (versionHistory uses it via auto-import)
const { useContentStore } = await import('~~/layers/editor/stores/content')
vi.stubGlobal('useContentStore', useContentStore)

// Import versionHistory AFTER all its auto-import deps are stubbed
const { useVersionHistoryStore } = await import('~~/layers/editor/stores/versionHistory')

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

      const contentStore = useContentStore()
      contentStore.id = 1

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

      const contentStore = useContentStore()
      contentStore.id = 1

      const store = useVersionHistoryStore()

      await store.selectVersion(1)

      expect(mockGetVersion).toHaveBeenCalledWith(1, 1)
      expect(store.selectedVersion).toEqual(mockVersionDetail)
    })
  })
})
