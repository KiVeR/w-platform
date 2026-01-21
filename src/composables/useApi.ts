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

  async function apiFetch<T>(
    url: string,
    options: FetchOptions = {},
  ): Promise<T> {
    const fetchWithAuth = async (isRetry = false): Promise<T> => {
      try {
        return await $fetch<T>(url, {
          ...options,
          credentials: 'include',
          headers: {
            ...options.headers,
            ...(authStore.accessToken && {
              Authorization: `Bearer ${authStore.accessToken}`,
            }),
          },
        })
      }
      catch (error: unknown) {
        const fetchError = error as { statusCode?: number }

        if (fetchError.statusCode === 401 && !isRetry) {
          const newToken = await tokenRefreshManager.refreshToken()

          if (newToken) {
            return fetchWithAuth(true)
          }

          authStore.clearAuth()
          router.push('/login')
          throw new Error('Session expirée')
        }

        throw error
      }
    }

    return fetchWithAuth()
  }

  return {
    apiFetch,
    get: <T>(url: string, options?: FetchOptions) =>
      apiFetch<T>(url, { ...options, method: 'GET' }),
    post: <T>(url: string, body?: unknown, options?: FetchOptions) =>
      apiFetch<T>(url, { ...options, method: 'POST', body }),
    put: <T>(url: string, body?: unknown, options?: FetchOptions) =>
      apiFetch<T>(url, { ...options, method: 'PUT', body }),
    delete: <T>(url: string, options?: FetchOptions) =>
      apiFetch<T>(url, { ...options, method: 'DELETE' }),
  }
}
