import type { ContentType, PageStatusType } from './content'

export interface CreateContentRequest {
  type: ContentType
  title: string
}

export interface CreateContentResponse {
  id: number
  type: ContentType
  title: string
  status: PageStatusType
  createdAt: string
  updatedAt: string
}

export interface LoadContentDesignResponse {
  id: number
  title: string
  status: PageStatusType
  variableSchemaUuid?: string | null
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
  status: PageStatusType
  updatedAt: string
}

export interface GetVersionsParams {
  page?: number
  pageSize?: number
}

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

export interface ContentAdapter {
  createContent: (data: CreateContentRequest) => Promise<CreateContentResponse | null>
  loadDesign: (contentId: number) => Promise<LoadContentDesignResponse | null>
  saveDesign: (contentId: number, design: DesignDocument) => Promise<SaveContentDesignResponse | null>
  updateContent: (contentId: number, data: { title?: string, status?: PageStatusType }) => Promise<UpdateContentResponse | null>
  deleteContent: (contentId: number) => Promise<boolean>
  attachSchema: (contentId: number, uuid: string) => Promise<UpdateContentResponse | null>
  detachSchema: (contentId: number) => Promise<UpdateContentResponse | null>
}

export interface ContentVersionAdapter {
  getVersions: (contentId: number, params?: GetVersionsParams) => Promise<VersionsResponse | null>
  getVersion: (contentId: number, versionId: number) => Promise<VersionDetail | null>
  restoreVersion: (contentId: number, versionId: number) => Promise<RestoreVersionResponse | null>
}
