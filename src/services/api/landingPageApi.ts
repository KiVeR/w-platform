import type { LoadDesignResponse, SaveDesignResponse, UploadAssetResponse } from './types'
import type { DesignDocument } from '@/types/widget'
import { apiClient } from './client'

export interface LandingPageApi {
  loadDesign: (id: number) => Promise<LoadDesignResponse | null>
  saveDesign: (id: number, design: DesignDocument) => Promise<SaveDesignResponse | null>
  uploadAsset: (id: number, file: File) => Promise<UploadAssetResponse | null>
}

export const landingPageApi: LandingPageApi = {
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

    try {
      const response = await fetch(`/api/v2/landing-pages/${id}/assets`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok)
        return null
      return response.json()
    }
    catch {
      return null
    }
  },
}
