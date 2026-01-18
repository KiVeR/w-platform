import type { DesignDocument } from '@/types/widget'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface SaveDesignRequest {
  design: DesignDocument
  lastModified?: string
}

export interface SaveDesignResponse {
  id: number
  savedAt: string
  version: string
}

export interface LoadDesignResponse {
  id: number
  design: DesignDocument
  lastModified: string
  createdAt: string
}

export interface UploadAssetResponse {
  url: string
  filename: string
  size: number
}

export interface CreateLandingPageRequest {
  title: string
}

export interface CreateLandingPageResponse {
  id: number
  title: string
  slug: string
}

// List landing pages
export interface LandingPageListItem {
  id: number
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  ownerId: number
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  owner: {
    id: number
    firstName: string | null
    lastName: string | null
  }
  _count: {
    designVersions: number
  }
}

export interface LandingPagesListResponse {
  data: LandingPageListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LandingPagesListParams {
  page?: number
  limit?: number
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  search?: string
  sortBy?: 'title' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

// Version history
export interface VersionSummary {
  id: number
  version: string
  widgetCount: number
  createdAt: string
  isLatest: boolean
}

export interface VersionDetail extends VersionSummary {
  design: DesignDocument
}

export interface VersionListResponse {
  data: VersionSummary[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface VersionListParams {
  page?: number
  limit?: number
  sortOrder?: 'asc' | 'desc'
}

export interface RestoreVersionResponse {
  id: number
  version: string
  widgetCount: number
  createdAt: string
  restoredFrom: {
    id: number
    version: string
  }
  purgedVersions: number
}
