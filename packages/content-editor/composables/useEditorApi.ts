import type { NitroFetchOptions } from 'nitropack'

const DEFAULT_TIMEOUT = 10000

type FetchOptions = NitroFetchOptions<string> & { timeout?: number }
type EditorApiConfig = Pick<EditorConfig, 'apiBaseUrl' | 'credentials' | 'getAuthToken' | 'refreshToken' | 'onAuthFailure'>

/**
 * Unified HTTP client for the editor layer.
 * Uses `useEditorConfig()` for base URL, auth token, and error handling.
 * Replaces both `apiClient` (src/services/api/client.ts) and `useApi()` (src/composables/useApi.ts).
 */
export function createEditorApiClient(config: EditorApiConfig) {
  async function apiFetch<T>(
    endpoint: string,
    options: FetchOptions = {},
    isRetry = false,
  ): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options

    const token = config.getAuthToken()
    const headers: Record<string, string> = {
      ...(fetchOptions.headers as Record<string, string>),
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const url = `${config.apiBaseUrl}${endpoint}`

    try {
      return await $fetch<T>(url, {
        ...fetchOptions,
        ...(config.credentials ? { credentials: config.credentials } : {}),
        headers,
        timeout,
      })
    }
    catch (error: unknown) {
      const fetchError = error as { statusCode?: number }

      if (fetchError.statusCode !== 401 || isRetry) {
        throw error
      }

      // Attempt token refresh
      if (config.refreshToken) {
        const newToken = await config.refreshToken()
        if (newToken) {
          return apiFetch<T>(endpoint, options, true)
        }
      }

      config.onAuthFailure?.()
      throw new Error('Session expired')
    }
  }

  return {
    get: <T>(endpoint: string, opts?: FetchOptions) =>
      apiFetch<T>(endpoint, { ...opts, method: 'GET' }),

    post: <T>(endpoint: string, body?: unknown, opts?: FetchOptions) =>
      apiFetch<T>(endpoint, { ...opts, method: 'POST', body: body as any }),

    put: <T>(endpoint: string, body?: unknown, opts?: FetchOptions) =>
      apiFetch<T>(endpoint, { ...opts, method: 'PUT', body: body as any }),

    patch: <T>(endpoint: string, body?: unknown, opts?: FetchOptions) =>
      apiFetch<T>(endpoint, { ...opts, method: 'PATCH', body: body as any }),

    delete: <T>(endpoint: string, opts?: FetchOptions) =>
      apiFetch<T>(endpoint, { ...opts, method: 'DELETE' }),
  }
}

export function useEditorApi() {
  return createEditorApiClient(useEditorConfig())
}
