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
