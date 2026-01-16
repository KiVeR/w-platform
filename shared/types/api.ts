import type { UserPublic } from './user'

// Auth responses
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: UserPublic
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

// Generic API responses
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// Error response
export interface ApiError {
  statusCode: number
  message: string
  errors?: Record<string, string[]>
}
