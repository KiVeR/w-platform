import type { ApiResponse } from './types'
import { tokenRefreshManager } from './tokenRefreshManager'

const BASE_URL = '/api/v1'

interface RequestOptions extends RequestInit {
  timeout?: number
  _isRetry?: boolean
}

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken')
  }
  return null
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { timeout = 10000, _isRetry = false, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        ...headers,
        ...fetchOptions.headers,
      },
    })

    clearTimeout(timeoutId)

    // Handle 401 Unauthorized - attempt token refresh
    if (response.status === 401 && !_isRetry) {
      const newToken = await tokenRefreshManager.refreshToken()

      if (newToken) {
        // Retry the original request with the new token
        return request<T>(endpoint, { ...options, _isRetry: true })
      }

      // Refresh failed - return error response
      return {
        success: false,
        error: 'Session expirée. Veuillez vous reconnecter.',
        timestamp: new Date().toISOString(),
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, data, timestamp: new Date().toISOString() }
  }
  catch (error) {
    clearTimeout(timeoutId)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString(),
    }
  }
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
}
