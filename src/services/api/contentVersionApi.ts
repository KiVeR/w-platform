import type { DesignDocument } from '@/types/widget'
import { apiClient } from './client'

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
  getVersions: (campaignId: number, contentId: number, params?: GetVersionsParams) => Promise<VersionsResponse | null>
  getVersion: (campaignId: number, contentId: number, versionId: number) => Promise<VersionDetail | null>
  restoreVersion: (campaignId: number, contentId: number, versionId: number) => Promise<RestoreVersionResponse | null>
}

export const contentVersionApi: ContentVersionApi = {
  async getVersions(
    campaignId: number,
    contentId: number,
    params?: GetVersionsParams,
  ): Promise<VersionsResponse | null> {
    const queryParams = new URLSearchParams()
    if (params?.page)
      queryParams.set('page', String(params.page))
    if (params?.pageSize)
      queryParams.set('pageSize', String(params.pageSize))

    const queryString = queryParams.toString()
    const url = `/campaigns/${campaignId}/contents/${contentId}/versions${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get<VersionsResponse>(url)
    return response.success ? response.data ?? null : null
  },

  async getVersion(
    campaignId: number,
    contentId: number,
    versionId: number,
  ): Promise<VersionDetail | null> {
    const response = await apiClient.get<VersionDetail>(
      `/campaigns/${campaignId}/contents/${contentId}/versions/${versionId}`,
    )
    return response.success ? response.data ?? null : null
  },

  async restoreVersion(
    campaignId: number,
    contentId: number,
    versionId: number,
  ): Promise<RestoreVersionResponse | null> {
    const response = await apiClient.post<RestoreVersionResponse>(
      `/campaigns/${campaignId}/contents/${contentId}/versions`,
      { versionId },
    )
    return response.success ? response.data ?? null : null
  },
}
