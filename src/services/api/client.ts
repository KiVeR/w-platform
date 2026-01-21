import type { ApiResponse } from './types'
import { tokenRefreshManager } from './tokenRefreshManager'

const BASE_URL = '/api/v1'
const DEFAULT_TIMEOUT = 10000

function getAuthToken(): string | null {
  if (typeof window === 'undefined')
    return null
  return localStorage.getItem('accessToken')
}

function buildHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function request<T>(
  endpoint: string,
  options: RequestInit & { timeout?: number } = {},
  isRetry = false,
): Promise<ApiResponse<T>> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        ...buildHeaders(getAuthToken()),
        ...(fetchOptions.headers as Record<string, string>),
      },
    })

    clearTimeout(timeoutId)

    if (response.status === 401 && !isRetry) {
      const newToken = await tokenRefreshManager.refreshToken()
      if (newToken) {
        return request<T>(endpoint, options, true)
      }
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.', timestamp: new Date().toISOString() }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, data, timestamp: new Date().toISOString() }
  }
  catch (error) {
    clearTimeout(timeoutId)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return { success: false, error: message, timestamp: new Date().toISOString() }
  }
}

function get<T>(endpoint: string): Promise<ApiResponse<T>> {
  return request<T>(endpoint, { method: 'GET' })
}

function post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  return request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) })
}

function put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  return request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) })
}

function patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  return request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) })
}

function del<T>(endpoint: string): Promise<ApiResponse<T>> {
  return request<T>(endpoint, { method: 'DELETE' })
}

export const apiClient = { get, post, put, patch, delete: del }
