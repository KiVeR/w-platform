import type { CreateLandingPageRequest, CreateLandingPageResponse, LandingPagesListParams, LandingPagesListResponse, LoadDesignResponse, RestoreVersionResponse, SaveDesignResponse, UploadAssetResponse, VersionDetail, VersionListParams, VersionListResponse } from './types'
import type { DesignDocument } from '@/types/widget'
import { apiClient } from './client'
import { tokenRefreshManager } from './tokenRefreshManager'

export interface LandingPageApi {
  getLandingPages: (params?: LandingPagesListParams) => Promise<LandingPagesListResponse | null>
  createLandingPage: (data: CreateLandingPageRequest) => Promise<CreateLandingPageResponse | null>
  deleteLandingPage: (id: number, hard?: boolean) => Promise<boolean>
  loadDesign: (id: number) => Promise<LoadDesignResponse | null>
  saveDesign: (id: number, design: DesignDocument) => Promise<SaveDesignResponse | null>
  uploadAsset: (id: number, file: File) => Promise<UploadAssetResponse | null>
  // Version history
  getVersions: (id: number, params?: VersionListParams) => Promise<VersionListResponse | null>
  getVersion: (id: number, versionId: number) => Promise<VersionDetail | null>
  restoreVersion: (id: number, fromVersionId: number, comment?: string) => Promise<RestoreVersionResponse | null>
}

export const landingPageApi: LandingPageApi = {
  async getLandingPages(params?: LandingPagesListParams): Promise<LandingPagesListResponse | null> {
    const searchParams = new URLSearchParams()
    if (params?.page)
      searchParams.set('page', String(params.page))
    if (params?.limit)
      searchParams.set('limit', String(params.limit))
    if (params?.status)
      searchParams.set('status', params.status)
    if (params?.search)
      searchParams.set('search', params.search)
    if (params?.sortBy)
      searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder)
      searchParams.set('sortOrder', params.sortOrder)

    const query = searchParams.toString()
    const endpoint = query ? `/landing-pages?${query}` : '/landing-pages'

    const response = await apiClient.get<LandingPagesListResponse>(endpoint)
    return response.success ? response.data ?? null : null
  },

  async createLandingPage(data: CreateLandingPageRequest): Promise<CreateLandingPageResponse | null> {
    const response = await apiClient.post<CreateLandingPageResponse>(
      '/landing-pages',
      data,
    )
    return response.success ? response.data ?? null : null
  },

  async deleteLandingPage(id: number, hard = false): Promise<boolean> {
    const endpoint = hard ? `/landing-pages/${id}?hard=true` : `/landing-pages/${id}`
    const response = await apiClient.delete<{ success: boolean }>(endpoint)
    return response.success
  },

  async loadDesign(id: number): Promise<LoadDesignResponse | null> {
    const response = await apiClient.get<LoadDesignResponse>(
      `/landing-pages/${id}/design`,
    )
    return response.success ? response.data ?? null : null
  },

  async saveDesign(id: number, design: DesignDocument): Promise<SaveDesignResponse | null> {
    const response = await apiClient.post<SaveDesignResponse>(
      `/landing-pages/${id}/design`,
      { design },
    )
    return response.success ? response.data ?? null : null
  },

  async uploadAsset(id: number, file: File): Promise<UploadAssetResponse | null> {
    const formData = new FormData()
    formData.append('file', file)

    const doUpload = async (isRetry = false): Promise<UploadAssetResponse | null> => {
      const token = localStorage.getItem('accessToken')
      const headers: Record<string, string> = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      try {
        const response = await fetch(`/api/v1/landing-pages/${id}/assets`, {
          method: 'POST',
          body: formData,
          headers,
        })

        // Handle 401 - attempt token refresh
        if (response.status === 401 && !isRetry) {
          const newToken = await tokenRefreshManager.refreshToken()
          if (newToken) {
            return doUpload(true)
          }
          return null
        }

        if (!response.ok)
          return null
        return response.json()
      }
      catch {
        return null
      }
    }

    return doUpload()
  },

  async getVersions(id: number, params?: VersionListParams): Promise<VersionListResponse | null> {
    const searchParams = new URLSearchParams()
    if (params?.page)
      searchParams.set('page', String(params.page))
    if (params?.limit)
      searchParams.set('limit', String(params.limit))
    if (params?.sortOrder)
      searchParams.set('sortOrder', params.sortOrder)

    const query = searchParams.toString()
    const endpoint = query
      ? `/landing-pages/${id}/versions?${query}`
      : `/landing-pages/${id}/versions`

    const response = await apiClient.get<VersionListResponse>(endpoint)
    return response.success ? response.data ?? null : null
  },

  async getVersion(id: number, versionId: number): Promise<VersionDetail | null> {
    const response = await apiClient.get<VersionDetail>(
      `/landing-pages/${id}/versions/${versionId}`,
    )
    return response.success ? response.data ?? null : null
  },

  async restoreVersion(id: number, fromVersionId: number, comment?: string): Promise<RestoreVersionResponse | null> {
    const response = await apiClient.post<RestoreVersionResponse>(
      `/landing-pages/${id}/versions`,
      { fromVersionId, comment },
    )
    return response.success ? response.data ?? null : null
  },
}
