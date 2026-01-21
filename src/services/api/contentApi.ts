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

export interface UpdateContentResponse {
  id: number
  title: string
  status: string
  updatedAt: string
}

export interface ContentApi {
  createContent: (data: CreateContentRequest) => Promise<CreateContentResponse | null>
  loadDesign: (contentId: number) => Promise<LoadContentDesignResponse | null>
  saveDesign: (contentId: number, design: DesignDocument) => Promise<SaveContentDesignResponse | null>
  updateContent: (contentId: number, data: { title?: string, status?: string }) => Promise<UpdateContentResponse | null>
  deleteContent: (contentId: number) => Promise<boolean>
}

export const contentApi: ContentApi = {
  async createContent(data: CreateContentRequest): Promise<CreateContentResponse | null> {
    const response = await apiClient.post<CreateContentResponse>('/contents', data)
    return response.success ? response.data ?? null : null
  },

  async loadDesign(contentId: number): Promise<LoadContentDesignResponse | null> {
    const response = await apiClient.get<LoadContentDesignResponse>(`/contents/${contentId}/design`)
    return response.success ? response.data ?? null : null
  },

  async saveDesign(contentId: number, design: DesignDocument): Promise<SaveContentDesignResponse | null> {
    const response = await apiClient.put<SaveContentDesignResponse>(`/contents/${contentId}/design`, { design })
    return response.success ? response.data ?? null : null
  },

  async updateContent(contentId: number, data: { title?: string, status?: string }): Promise<UpdateContentResponse | null> {
    const response = await apiClient.patch<UpdateContentResponse>(`/contents/${contentId}`, data)
    return response.success ? response.data ?? null : null
  },

  async deleteContent(contentId: number): Promise<boolean> {
    const response = await apiClient.delete<{ success: boolean }>(`/contents/${contentId}`)
    return response.success
  },
}
