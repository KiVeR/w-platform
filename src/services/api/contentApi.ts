import type { ContentType } from '#shared/types/content'
import type { DesignDocument } from '@/types/widget'
import { apiClient } from './client'

export interface CreateContentRequest {
  type: ContentType
  title: string
}

export interface CreateContentResponse {
  id: number
  type: ContentType
  campaignId: number
  title: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface LoadContentDesignResponse {
  id: number
  title: string
  status: string
  design: DesignDocument
  updatedAt: string
}

export interface SaveContentDesignResponse {
  success: boolean
  id: number
  updatedAt: string
}

export interface ContentApi {
  createContent: (campaignId: number, data: CreateContentRequest) => Promise<CreateContentResponse | null>
  loadDesign: (campaignId: number, contentId: number) => Promise<LoadContentDesignResponse | null>
  saveDesign: (campaignId: number, contentId: number, design: DesignDocument) => Promise<SaveContentDesignResponse | null>
  deleteContent: (campaignId: number, contentId: number) => Promise<boolean>
}

export const contentApi: ContentApi = {
  async createContent(campaignId: number, data: CreateContentRequest): Promise<CreateContentResponse | null> {
    const response = await apiClient.post<CreateContentResponse>(
      `/campaigns/${campaignId}/contents`,
      data,
    )
    return response.success ? response.data ?? null : null
  },

  async loadDesign(campaignId: number, contentId: number): Promise<LoadContentDesignResponse | null> {
    const response = await apiClient.get<LoadContentDesignResponse>(
      `/campaigns/${campaignId}/contents/${contentId}/design`,
    )
    return response.success ? response.data ?? null : null
  },

  async saveDesign(campaignId: number, contentId: number, design: DesignDocument): Promise<SaveContentDesignResponse | null> {
    const response = await apiClient.put<SaveContentDesignResponse>(
      `/campaigns/${campaignId}/contents/${contentId}/design`,
      { design },
    )
    return response.success ? response.data ?? null : null
  },

  async deleteContent(campaignId: number, contentId: number): Promise<boolean> {
    const response = await apiClient.delete<{ success: boolean }>(
      `/campaigns/${campaignId}/contents/${contentId}`,
    )
    return response.success
  },
}
