import type { NitroFetchOptions } from 'nitropack'
import { tokenRefreshManager } from '@/services/api/tokenRefreshManager'
import { useAuthStore } from '@/stores/auth'

type FetchOptions = NitroFetchOptions<string>

/**
 * Composable for API calls with automatic 401 handling.
 * - Adds Authorization header automatically
 * - On 401: attempts token refresh, retries once
 * - On refresh failure: clears auth and redirects to /login
 */
export function useApi() {
  const authStore = useAuthStore()
  const router = useRouter()

  async function apiFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
    const headers = authStore.accessToken
      ? { ...options.headers, Authorization: `Bearer ${authStore.accessToken}` }
      : options.headers

    try {
      return await $fetch<T>(url, { ...options, credentials: 'include', headers })
    }
    catch (error: unknown) {
      const fetchError = error as { statusCode?: number }

      if (fetchError.statusCode !== 401) {
        throw error
      }

      const newToken = await tokenRefreshManager.refreshToken()
      if (newToken) {
        const retryHeaders = { ...options.headers, Authorization: `Bearer ${newToken}` }
        return $fetch<T>(url, { ...options, credentials: 'include', headers: retryHeaders })
      }

      authStore.clearAuth()
      router.push('/login')
      throw new Error('Session expirée')
    }
  }

  function get<T>(url: string, options?: FetchOptions): Promise<T> {
    return apiFetch<T>(url, { ...options, method: 'GET' })
  }

  function post<T>(url: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return apiFetch<T>(url, { ...options, method: 'POST', body })
  }

  function put<T>(url: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return apiFetch<T>(url, { ...options, method: 'PUT', body })
  }

  function del<T>(url: string, options?: FetchOptions): Promise<T> {
    return apiFetch<T>(url, { ...options, method: 'DELETE' })
  }

  return { apiFetch, get, post, put, delete: del }
}
