import { flushPromises } from '@vue/test-utils'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { createVersionDetail, createVersionsResponse, createVersionSummary } from '../../helpers/factories'
import { stubContentVersionApi } from '../../helpers/stubs'

// Re-stub Nuxt auto-imports (unstubGlobals restores after each test)
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('defineStore', defineStore)

const mockEditorStore = { setDesign: vi.fn(), markAsSaved: vi.fn() }
const mockWidgetsStore = { setWidgets: vi.fn() }
const mockUIStore = { isHistoryMode: false, enterHistoryMode: vi.fn(), exitHistoryMode: vi.fn() }
const mockContentStore = { id: 1 as number | null }

vi.stubGlobal('useEditorStore', () => mockEditorStore)
vi.stubGlobal('useWidgetsStore', () => mockWidgetsStore)
vi.stubGlobal('useUIStore', () => mockUIStore)
vi.stubGlobal('useContentStore', () => mockContentStore)

const versionApi = stubContentVersionApi()

const { useVersionHistoryStore } = await import('#editor/stores/versionHistory')

describe('useVersionHistoryStore', () => {
  beforeEach(() => {
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('defineStore', defineStore)
    setActivePinia(createPinia())
    mockContentStore.id = 1
    mockUIStore.isHistoryMode = false
    mockEditorStore.setDesign.mockReset()
    mockEditorStore.markAsSaved.mockReset()
    mockWidgetsStore.setWidgets.mockReset()
    mockUIStore.enterHistoryMode.mockReset()
    mockUIStore.exitHistoryMode.mockReset()
    versionApi.getVersions.mockReset()
    versionApi.getVersion.mockReset()
    versionApi.restoreVersion.mockReset()
  })

  describe('initial state', () => {
    it('has empty versions array', () => {
      const store = useVersionHistoryStore()
      expect(store.versions).toEqual([])
    })

    it('has selectedVersion null', () => {
      const store = useVersionHistoryStore()
      expect(store.selectedVersion).toBeNull()
    })

    it('has isLoading false', () => {
      const store = useVersionHistoryStore()
      expect(store.isLoading).toBe(false)
    })

    it('has isLoadingVersion false', () => {
      const store = useVersionHistoryStore()
      expect(store.isLoadingVersion).toBe(false)
    })

    it('has isRestoring false', () => {
      const store = useVersionHistoryStore()
      expect(store.isRestoring).toBe(false)
    })
  })

  describe('loadVersions', () => {
    it('calls getVersions with page 1 and pageSize 10', async () => {
      const response = createVersionsResponse()
      versionApi.getVersions.mockResolvedValue(response)

      const store = useVersionHistoryStore()
      await store.loadVersions()
      await flushPromises()

      expect(versionApi.getVersions).toHaveBeenCalledWith(1, { page: 1, pageSize: 10 })
    })

    it('does nothing when contentId is null', async () => {
      mockContentStore.id = null

      const store = useVersionHistoryStore()
      await store.loadVersions()
      await flushPromises()

      expect(versionApi.getVersions).not.toHaveBeenCalled()
    })

    it('sets versions, total, hasMore, and rateLimit on success', async () => {
      const response = createVersionsResponse({
        pagination: { total: 25, page: 1, pageSize: 10, totalPages: 3 },
      })
      versionApi.getVersions.mockResolvedValue(response)

      const store = useVersionHistoryStore()
      await store.loadVersions()
      await flushPromises()

      expect(store.versions).toEqual(response.versions)
      expect(store.total).toBe(25)
      expect(store.hasMore).toBe(true)
      expect(store.rateLimit).toEqual(response.rateLimit)
    })

    it('sets hasMore to false when on last page', async () => {
      const response = createVersionsResponse({
        pagination: { total: 2, page: 1, pageSize: 10, totalPages: 1 },
      })
      versionApi.getVersions.mockResolvedValue(response)

      const store = useVersionHistoryStore()
      await store.loadVersions()
      await flushPromises()

      expect(store.hasMore).toBe(false)
    })

    it('sets isLoading to true during the call', async () => {
      let resolvePromise: (value: unknown) => void
      const pending = new Promise((resolve) => {
        resolvePromise = resolve
      })
      versionApi.getVersions.mockReturnValue(pending)

      const store = useVersionHistoryStore()
      const promise = store.loadVersions()

      expect(store.isLoading).toBe(true)

      resolvePromise!(createVersionsResponse())
      await promise
      await flushPromises()

      expect(store.isLoading).toBe(false)
    })

    it('resets isLoading on error', async () => {
      versionApi.getVersions.mockRejectedValue(new Error('network error'))

      const store = useVersionHistoryStore()
      await store.loadVersions().catch(() => {})
      await flushPromises()

      expect(store.isLoading).toBe(false)
    })
  })

  describe('loadMore', () => {
    it('increments page and calls getVersions', async () => {
      const firstResponse = createVersionsResponse({
        pagination: { total: 20, page: 1, pageSize: 10, totalPages: 2 },
      })
      versionApi.getVersions.mockResolvedValue(firstResponse)

      const store = useVersionHistoryStore()
      await store.loadVersions()
      await flushPromises()

      const secondResponse = createVersionsResponse({
        versions: [createVersionSummary({ id: 10 })],
        pagination: { total: 20, page: 2, pageSize: 10, totalPages: 2 },
      })
      versionApi.getVersions.mockResolvedValue(secondResponse)

      await store.loadMore()
      await flushPromises()

      expect(versionApi.getVersions).toHaveBeenCalledWith(1, { page: 2, pageSize: 10 })
    })

    it('concatenates new versions to existing ones', async () => {
      const firstVersions = [createVersionSummary({ id: 1 }), createVersionSummary({ id: 2 })]
      const firstResponse = createVersionsResponse({
        versions: firstVersions,
        pagination: { total: 3, page: 1, pageSize: 2, totalPages: 2 },
      })
      versionApi.getVersions.mockResolvedValue(firstResponse)

      const store = useVersionHistoryStore()
      await store.loadVersions()
      await flushPromises()

      const secondVersions = [createVersionSummary({ id: 3 })]
      const secondResponse = createVersionsResponse({
        versions: secondVersions,
        pagination: { total: 3, page: 2, pageSize: 2, totalPages: 2 },
      })
      versionApi.getVersions.mockResolvedValue(secondResponse)

      await store.loadMore()
      await flushPromises()

      expect(store.versions).toHaveLength(3)
      expect(store.versions[0].id).toBe(1)
      expect(store.versions[2].id).toBe(3)
    })

    it('skips if isLoading is true', async () => {
      let resolveFirst: (value: unknown) => void
      const pendingFirst = new Promise((resolve) => {
        resolveFirst = resolve
      })
      versionApi.getVersions.mockReturnValue(pendingFirst)

      const store = useVersionHistoryStore()
      // Start loadVersions to set isLoading=true
      const promise = store.loadVersions()

      // Try to loadMore while isLoading
      await store.loadMore()
      await flushPromises()

      // getVersions was called once for loadVersions, not again for loadMore
      expect(versionApi.getVersions).toHaveBeenCalledTimes(1)

      resolveFirst!(createVersionsResponse())
      await promise
      await flushPromises()
    })

    it('skips if hasMore is false', async () => {
      const response = createVersionsResponse({
        pagination: { total: 2, page: 1, pageSize: 10, totalPages: 1 },
      })
      versionApi.getVersions.mockResolvedValue(response)

      const store = useVersionHistoryStore()
      await store.loadVersions()
      await flushPromises()

      versionApi.getVersions.mockClear()
      await store.loadMore()
      await flushPromises()

      expect(versionApi.getVersions).not.toHaveBeenCalled()
    })

    it('resets isLoading on error', async () => {
      const firstResponse = createVersionsResponse({
        pagination: { total: 20, page: 1, pageSize: 10, totalPages: 2 },
      })
      versionApi.getVersions.mockResolvedValue(firstResponse)

      const store = useVersionHistoryStore()
      await store.loadVersions()
      await flushPromises()

      versionApi.getVersions.mockRejectedValue(new Error('network error'))

      await store.loadMore().catch(() => {})
      await flushPromises()

      expect(store.isLoading).toBe(false)
    })
  })

  describe('selectVersion', () => {
    it('calls getVersion and sets selectedVersion', async () => {
      const detail = createVersionDetail({ id: 42 })
      versionApi.getVersion.mockResolvedValue(detail)

      const store = useVersionHistoryStore()
      await store.selectVersion(42)
      await flushPromises()

      expect(versionApi.getVersion).toHaveBeenCalledWith(1, 42)
      expect(store.selectedVersion).toEqual(detail)
    })

    it('returns cached version without API call', async () => {
      const detail = createVersionDetail({ id: 7 })
      versionApi.getVersion.mockResolvedValue(detail)

      const store = useVersionHistoryStore()
      // First call populates cache
      await store.selectVersion(7)
      await flushPromises()

      versionApi.getVersion.mockClear()

      // Second call should hit cache
      await store.selectVersion(7)
      await flushPromises()

      expect(versionApi.getVersion).not.toHaveBeenCalled()
      expect(store.selectedVersion).toEqual(detail)
    })

    it('evicts oldest cache entry when cache size >= 5', async () => {
      const store = useVersionHistoryStore()

      // Fill cache with 5 entries (ids 1-5)
      for (let i = 1; i <= 5; i++) {
        const detail = createVersionDetail({ id: i })
        versionApi.getVersion.mockResolvedValue(detail)
        await store.selectVersion(i)
        await flushPromises()
      }

      versionApi.getVersion.mockClear()

      // Add 6th entry, should evict id=1
      const detail6 = createVersionDetail({ id: 6 })
      versionApi.getVersion.mockResolvedValue(detail6)
      await store.selectVersion(6)
      await flushPromises()

      versionApi.getVersion.mockClear()

      // id=1 should no longer be cached, requires API call
      const detail1 = createVersionDetail({ id: 1 })
      versionApi.getVersion.mockResolvedValue(detail1)
      await store.selectVersion(1)
      await flushPromises()

      expect(versionApi.getVersion).toHaveBeenCalledWith(1, 1)

      // id=3 should still be cached (eviction only removed id=1, then id=2)
      versionApi.getVersion.mockClear()
      await store.selectVersion(3)
      await flushPromises()

      expect(versionApi.getVersion).not.toHaveBeenCalled()
    })
  })

  describe('restoreVersion', () => {
    it('calls restoreVersion API', async () => {
      const detail = createVersionDetail({ id: 5 })
      versionApi.getVersion.mockResolvedValue(detail)
      versionApi.restoreVersion.mockResolvedValue({ rateLimit: { remaining: 49, limit: 60, resetAt: '2025-01-15T11:00:00Z' } })
      versionApi.getVersions.mockResolvedValue(createVersionsResponse())

      const store = useVersionHistoryStore()
      await store.selectVersion(5)
      await flushPromises()

      await store.restoreVersion(5)
      await flushPromises()

      expect(versionApi.restoreVersion).toHaveBeenCalledWith(1, 5)
    })

    it('updates editorStore.setDesign and widgetsStore.setWidgets', async () => {
      const detail = createVersionDetail({ id: 5 })
      versionApi.getVersion.mockResolvedValue(detail)
      versionApi.restoreVersion.mockResolvedValue({ rateLimit: { remaining: 49, limit: 60, resetAt: '2025-01-15T11:00:00Z' } })
      versionApi.getVersions.mockResolvedValue(createVersionsResponse())

      const store = useVersionHistoryStore()
      await store.selectVersion(5)
      await flushPromises()

      await store.restoreVersion(5)
      await flushPromises()

      expect(mockEditorStore.setDesign).toHaveBeenCalledWith(detail.design)
      expect(mockWidgetsStore.setWidgets).toHaveBeenCalledWith(detail.design.widgets)
    })

    it('calls markAsSaved after restoring', async () => {
      const detail = createVersionDetail({ id: 5 })
      versionApi.getVersion.mockResolvedValue(detail)
      versionApi.restoreVersion.mockResolvedValue({ rateLimit: { remaining: 49, limit: 60, resetAt: '2025-01-15T11:00:00Z' } })
      versionApi.getVersions.mockResolvedValue(createVersionsResponse())

      const store = useVersionHistoryStore()
      await store.selectVersion(5)
      await flushPromises()

      await store.restoreVersion(5)
      await flushPromises()

      expect(mockEditorStore.markAsSaved).toHaveBeenCalled()
    })

    it('reloads versions after successful restore', async () => {
      const detail = createVersionDetail({ id: 5 })
      versionApi.getVersion.mockResolvedValue(detail)
      versionApi.restoreVersion.mockResolvedValue({ rateLimit: { remaining: 49, limit: 60, resetAt: '2025-01-15T11:00:00Z' } })
      versionApi.getVersions.mockResolvedValue(createVersionsResponse())

      const store = useVersionHistoryStore()
      await store.selectVersion(5)
      await flushPromises()

      versionApi.getVersions.mockClear()

      await store.restoreVersion(5)
      await flushPromises()

      // loadVersions is called (fire-and-forget) after successful restore
      expect(versionApi.getVersions).toHaveBeenCalled()
    })

    it('returns false when response is truthy but selectedVersion is null', async () => {
      versionApi.restoreVersion.mockResolvedValue({ rateLimit: { remaining: 49, limit: 60, resetAt: '2025-01-15T11:00:00Z' } })

      const store = useVersionHistoryStore()
      // Do not select a version, selectedVersion remains null
      const result = await store.restoreVersion(5)
      await flushPromises()

      expect(result).toBe(false)
      expect(mockEditorStore.setDesign).not.toHaveBeenCalled()
    })

    it('clears cache and exits history mode in finally block', async () => {
      const detail = createVersionDetail({ id: 5 })
      versionApi.getVersion.mockResolvedValue(detail)
      versionApi.restoreVersion.mockResolvedValue({ rateLimit: { remaining: 49, limit: 60, resetAt: '2025-01-15T11:00:00Z' } })
      versionApi.getVersions.mockResolvedValue(createVersionsResponse())

      const store = useVersionHistoryStore()
      await store.selectVersion(5)
      await flushPromises()

      await store.restoreVersion(5)
      await flushPromises()

      // Exit history mode clears selectedVersion and calls uiStore.exitHistoryMode
      expect(store.selectedVersion).toBeNull()
      expect(mockUIStore.exitHistoryMode).toHaveBeenCalled()

      // Cache was cleared: next selectVersion should call API
      versionApi.getVersion.mockClear()
      const freshDetail = createVersionDetail({ id: 5 })
      versionApi.getVersion.mockResolvedValue(freshDetail)
      await store.selectVersion(5)
      await flushPromises()

      expect(versionApi.getVersion).toHaveBeenCalledWith(1, 5)
    })

    it('returns false when contentId is null', async () => {
      mockContentStore.id = null

      const store = useVersionHistoryStore()
      const result = await store.restoreVersion(5)
      await flushPromises()

      expect(result).toBe(false)
      expect(versionApi.restoreVersion).not.toHaveBeenCalled()
    })
  })

  describe('enterHistoryMode', () => {
    it('calls uiStore.enterHistoryMode, loadVersions, and selectVersion[0]', async () => {
      const versionsResponse = createVersionsResponse({
        versions: [createVersionSummary({ id: 10 }), createVersionSummary({ id: 11 })],
      })
      versionApi.getVersions.mockResolvedValue(versionsResponse)

      const detail = createVersionDetail({ id: 10 })
      versionApi.getVersion.mockResolvedValue(detail)

      const store = useVersionHistoryStore()
      await store.enterHistoryMode()
      await flushPromises()

      expect(mockUIStore.enterHistoryMode).toHaveBeenCalled()
      expect(versionApi.getVersions).toHaveBeenCalled()
      expect(versionApi.getVersion).toHaveBeenCalledWith(1, 10)
      expect(store.selectedVersion).toEqual(detail)
    })
  })

  describe('exitHistoryMode', () => {
    it('clears selectedVersion and calls uiStore.exitHistoryMode', async () => {
      const detail = createVersionDetail({ id: 3 })
      versionApi.getVersion.mockResolvedValue(detail)

      const store = useVersionHistoryStore()
      await store.selectVersion(3)
      await flushPromises()

      expect(store.selectedVersion).not.toBeNull()

      store.exitHistoryMode()

      expect(store.selectedVersion).toBeNull()
      expect(mockUIStore.exitHistoryMode).toHaveBeenCalled()
    })
  })

  describe('clearCache', () => {
    it('clears cache so selectVersion triggers API call', async () => {
      const detail = createVersionDetail({ id: 8 })
      versionApi.getVersion.mockResolvedValue(detail)

      const store = useVersionHistoryStore()
      await store.selectVersion(8)
      await flushPromises()

      versionApi.getVersion.mockClear()

      // Without clearCache, the cache would be used
      store.clearCache()

      const freshDetail = createVersionDetail({ id: 8 })
      versionApi.getVersion.mockResolvedValue(freshDetail)
      await store.selectVersion(8)
      await flushPromises()

      expect(versionApi.getVersion).toHaveBeenCalledWith(1, 8)
    })
  })

  describe('isActive computed', () => {
    it('reflects uiStore.isHistoryMode as false', () => {
      mockUIStore.isHistoryMode = false
      const store = useVersionHistoryStore()
      expect(store.isActive).toBe(false)
    })

    it('reflects uiStore.isHistoryMode as true', () => {
      mockUIStore.isHistoryMode = true
      const store = useVersionHistoryStore()
      expect(store.isActive).toBe(true)
    })
  })

  describe('lazy init of _contentVersionApi', () => {
    it('initializes contentVersionApi on first API call only', async () => {
      const useContentVersionApiSpy = vi.fn(() => versionApi)
      vi.stubGlobal('useContentVersionApi', useContentVersionApiSpy)

      // Create a fresh store to reset the lazy init
      setActivePinia(createPinia())
      const response = createVersionsResponse()
      versionApi.getVersions.mockResolvedValue(response)

      const store = useVersionHistoryStore()

      // First call initializes
      await store.loadVersions()
      await flushPromises()
      const callCount = useContentVersionApiSpy.mock.calls.length

      // Second call should not re-initialize
      versionApi.getVersions.mockResolvedValue(createVersionsResponse())
      await store.loadVersions()
      await flushPromises()

      expect(useContentVersionApiSpy.mock.calls.length).toBe(callCount)

      // Restore the original stub
      vi.stubGlobal('useContentVersionApi', () => versionApi)
    })
  })
})
