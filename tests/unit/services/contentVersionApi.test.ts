import { beforeEach, describe, expect, it } from 'vitest'
import { stubEditorApi } from '../../helpers/stubs'

// Stub useEditorApi before importing the module under test
const api = stubEditorApi()

const { useContentVersionApi } = await import('#editor/services/contentVersionApi')

describe('useContentVersionApi', () => {
  let versionApi: ReturnType<typeof useContentVersionApi>

  beforeEach(() => {
    // Re-stub so restoreMocks doesn't break subsequent tests
    Object.assign(api, stubEditorApi())
    versionApi = useContentVersionApi()
  })

  describe('getVersions', () => {
    it('calls api.get without query string when no params', async () => {
      api.get.mockResolvedValue({ versions: [] })

      await versionApi.getVersions(1)

      expect(api.get).toHaveBeenCalledWith('/contents/1/versions')
    })

    it('includes page and pageSize in query string', async () => {
      api.get.mockResolvedValue({ versions: [] })

      await versionApi.getVersions(1, { page: 2, pageSize: 5 })

      expect(api.get).toHaveBeenCalledWith('/contents/1/versions?page=2&pageSize=5')
    })

    it('includes only page when pageSize is not provided', async () => {
      api.get.mockResolvedValue({ versions: [] })

      await versionApi.getVersions(1, { page: 3 })

      expect(api.get).toHaveBeenCalledWith('/contents/1/versions?page=3')
    })

    it('includes only pageSize when page is not provided', async () => {
      api.get.mockResolvedValue({ versions: [] })

      await versionApi.getVersions(1, { pageSize: 20 })

      expect(api.get).toHaveBeenCalledWith('/contents/1/versions?pageSize=20')
    })

    it('returns null on error', async () => {
      api.get.mockRejectedValue(new Error('Network error'))

      const result = await versionApi.getVersions(1)

      expect(result).toBeNull()
    })

    it('returns response data correctly', async () => {
      const mockResponse = {
        versions: [
          { id: 1, version: '1.0', widgetCount: 5, createdAt: '2026-01-01', isCurrent: true },
          { id: 2, version: '0.9', widgetCount: 3, createdAt: '2025-12-15', isCurrent: false },
        ],
        pagination: { total: 2, page: 1, pageSize: 10, totalPages: 1 },
        rateLimit: { remaining: 9, limit: 10, resetAt: '2026-02-01T00:00:00Z' },
      }

      api.get.mockResolvedValue(mockResponse)

      const result = await versionApi.getVersions(1)

      expect(result).toEqual(mockResponse)
      expect(result!.versions).toHaveLength(2)
      expect(result!.pagination.total).toBe(2)
      expect(result!.rateLimit.remaining).toBe(9)
    })
  })

  describe('getVersion', () => {
    it('calls api.get with contentId and versionId', async () => {
      const mockDetail = {
        id: 42,
        version: '2.0',
        design: { globalStyles: {}, widgets: [] },
        widgetCount: 3,
        createdAt: '2026-01-10',
        isCurrent: false,
      }

      api.get.mockResolvedValue(mockDetail)

      const result = await versionApi.getVersion(1, 42)

      expect(api.get).toHaveBeenCalledWith('/contents/1/versions/42')
      expect(result).toEqual(mockDetail)
    })

    it('returns null on error', async () => {
      api.get.mockRejectedValue(new Error('Not found'))

      const result = await versionApi.getVersion(1, 999)

      expect(result).toBeNull()
    })
  })

  describe('restoreVersion', () => {
    it('calls api.post with contentId and versionId in body', async () => {
      const mockResponse = {
        success: true,
        restoredFromVersion: '1.0',
        newVersion: '3.0',
        newVersionId: 10,
        rateLimit: { remaining: 4, limit: 5, resetAt: '2026-02-01T00:00:00Z' },
      }

      api.post.mockResolvedValue(mockResponse)

      const result = await versionApi.restoreVersion(1, 42)

      expect(api.post).toHaveBeenCalledWith('/contents/1/versions', { versionId: 42 })
      expect(result).toEqual(mockResponse)
    })

    it('returns null on error', async () => {
      api.post.mockRejectedValue(new Error('Rate limited'))

      const result = await versionApi.restoreVersion(1, 42)

      expect(result).toBeNull()
    })
  })
})
