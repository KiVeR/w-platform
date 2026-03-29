import { tokenRefreshManager } from '@/services/api/tokenRefreshManager'

/**
 * Composable for API calls pointing to platform-api with automatic 401 handling.
 * - Uses Bearer token from tokenRefreshManager (not HttpOnly cookies)
 * - Base URL from runtimeConfig.public.platformApiUrl
 * - On 401: attempts token refresh via tokenRefreshManager, retries once
 * - On refresh failure: redirects to /login via navigateTo
 */
export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = `${config.public.platformApiUrl}/api`

  async function request<T>(url: string, options: Record<string, unknown> = {}): Promise<T> {
    const token = tokenRefreshManager.getAccessToken()
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    try {
      return await $fetch<T>(url, {
        baseURL,
        headers,
        ...options,
      })
    }
    catch (error: unknown) {
      const fetchError = error as { statusCode?: number; status?: number }

      if (fetchError.statusCode !== 401 && fetchError.status !== 401) {
        throw error
      }

      const newToken = await tokenRefreshManager.refreshToken()
      if (newToken) {
        return $fetch<T>(url, {
          baseURL,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
          ...options,
        })
      }

      navigateTo('/login')
      throw new Error('Session expirée')
    }
  }

  return {
    get: <T>(url: string, opts?: Record<string, unknown>) => request<T>(url, { method: 'GET', ...opts }),
    post: <T>(url: string, body?: unknown, opts?: Record<string, unknown>) => request<T>(url, { method: 'POST', body, ...opts }),
    put: <T>(url: string, body?: unknown, opts?: Record<string, unknown>) => request<T>(url, { method: 'PUT', body, ...opts }),
    patch: <T>(url: string, body?: unknown, opts?: Record<string, unknown>) => request<T>(url, { method: 'PATCH', body, ...opts }),
    delete: <T>(url: string, opts?: Record<string, unknown>) => request<T>(url, { method: 'DELETE', ...opts }),
  }
}
