import type {
  ContentAdapter,
  ContentVersionAdapter,
  CreateContentRequest,
  CreateContentResponse,
  LoadContentDesignResponse,
  RestoreVersionResponse,
  UpdateContentResponse,
  VersionDetail,
  VersionsResponse,
} from '../types/editor-adapters'
import type { PageStatusType } from '../types/content'

function normalizeStatus(status: string | null | undefined): PageStatusType {
  const normalized = String(status ?? 'DRAFT').toUpperCase()
  if (normalized === 'PUBLISHED' || normalized === 'ARCHIVED')
    return normalized
  return 'DRAFT'
}

export function createAIContentAdapter(api: ReturnType<typeof useEditorApi>): ContentAdapter {
  return {
    createContent(data: CreateContentRequest) {
      return api.post<CreateContentResponse>('/ai/contents', data)
    },

    loadDesign(contentId: number) {
      return api.get<LoadContentDesignResponse>(`/ai/contents/${contentId}/design`)
    },

    saveDesign(contentId: number, design: DesignDocument) {
      return api.put(`/ai/contents/${contentId}/design`, { design })
    },

    updateContent(contentId: number, data: { title?: string, status?: PageStatusType }) {
      return api.patch<UpdateContentResponse>(`/ai/contents/${contentId}`, data)
    },

    async deleteContent(contentId: number) {
      await api.delete(`/ai/contents/${contentId}`)
      return true
    },

    attachSchema(contentId: number, uuid: string) {
      return api.patch<UpdateContentResponse>(`/ai/contents/${contentId}`, { variableSchemaUuid: uuid })
    },

    detachSchema(contentId: number) {
      return api.patch<UpdateContentResponse>(`/ai/contents/${contentId}`, { variableSchemaUuid: null })
    },
  }
}

export function createAIContentVersionAdapter(api: ReturnType<typeof useEditorApi>): ContentVersionAdapter {
  return {
    getVersions(contentId: number, params?: { page?: number, pageSize?: number }) {
      const queryParams = new URLSearchParams()
      if (params?.page)
        queryParams.set('page', String(params.page))
      if (params?.pageSize)
        queryParams.set('pageSize', String(params.pageSize))

      const queryString = queryParams.toString()
      const url = `/ai/contents/${contentId}/versions${queryString ? `?${queryString}` : ''}`

      return api.get<VersionsResponse>(url)
    },

    getVersion(contentId: number, versionId: number) {
      return api.get<VersionDetail>(`/ai/contents/${contentId}/versions/${versionId}`)
    },

    restoreVersion(contentId: number, versionId: number) {
      return api.post<RestoreVersionResponse>(`/ai/contents/${contentId}/versions`, { versionId })
    },
  }
}

export function mapDashboardLandingPageStatus(status: string | null | undefined): PageStatusType {
  return normalizeStatus(status)
}
