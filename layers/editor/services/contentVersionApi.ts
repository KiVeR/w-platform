// =============================================================================
// TYPES
// =============================================================================

export interface VersionSummary {
  id: number
  version: string
  widgetCount: number
  createdAt: string
  isCurrent: boolean
}

export interface VersionDetail {
  id: number
  version: string
  design: DesignDocument
  widgetCount: number
  createdAt: string
  isCurrent: boolean
}

export interface RateLimitInfo {
  remaining: number
  limit: number
  resetAt: string
}

export interface VersionsResponse {
  versions: VersionSummary[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  rateLimit: RateLimitInfo
}

export interface RestoreVersionResponse {
  success: boolean
  restoredFromVersion: string
  newVersion: string
  newVersionId: number
  rateLimit: RateLimitInfo
}

export interface GetVersionsParams {
  page?: number
  pageSize?: number
}

// =============================================================================
// API
// =============================================================================

export interface ContentVersionApi {
  getVersions: (contentId: number, params?: GetVersionsParams) => Promise<VersionsResponse | null>
  getVersion: (contentId: number, versionId: number) => Promise<VersionDetail | null>
  restoreVersion: (contentId: number, versionId: number) => Promise<RestoreVersionResponse | null>
}

export function useContentVersionApi(): ContentVersionApi {
  const api = useEditorApi()

  return {
    async getVersions(contentId, params?) {
      const queryParams = new URLSearchParams()
      if (params?.page)
        queryParams.set('page', String(params.page))
      if (params?.pageSize)
        queryParams.set('pageSize', String(params.pageSize))

      const queryString = queryParams.toString()
      const url = `/contents/${contentId}/versions${queryString ? `?${queryString}` : ''}`

      try {
        return await api.get<VersionsResponse>(url)
      }
      catch {
        return null
      }
    },

    async getVersion(contentId, versionId) {
      try {
        return await api.get<VersionDetail>(`/contents/${contentId}/versions/${versionId}`)
      }
      catch {
        return null
      }
    },

    async restoreVersion(contentId, versionId) {
      try {
        return await api.post<RestoreVersionResponse>(
          `/contents/${contentId}/versions`,
          { versionId },
        )
      }
      catch {
        return null
      }
    },
  }
}
