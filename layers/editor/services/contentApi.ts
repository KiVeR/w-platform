import type { ContentType } from '#shared/types/content'

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

export function useContentApi(): ContentApi {
  const api = useEditorApi()

  return {
    async createContent(data) {
      try {
        return await api.post<CreateContentResponse>('/contents', data)
      }
      catch {
        return null
      }
    },

    async loadDesign(contentId) {
      try {
        return await api.get<LoadContentDesignResponse>(`/contents/${contentId}/design`)
      }
      catch {
        return null
      }
    },

    async saveDesign(contentId, design) {
      try {
        return await api.put<SaveContentDesignResponse>(`/contents/${contentId}/design`, { design })
      }
      catch {
        return null
      }
    },

    async updateContent(contentId, data) {
      try {
        return await api.patch<UpdateContentResponse>(`/contents/${contentId}`, data)
      }
      catch {
        return null
      }
    },

    async deleteContent(contentId) {
      try {
        await api.delete(`/contents/${contentId}`)
        return true
      }
      catch {
        return false
      }
    },
  }
}
