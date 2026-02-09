import type { Middleware } from 'openapi-fetch'
import { toast } from 'vue-sonner'

export function createAuthMiddleware(
  getToken: () => string | null,
  refresh: () => Promise<string | null>,
  onAuthFailure: () => void,
): Middleware {
  let isRetrying = false

  return {
    async onRequest({ request }) {
      const token = getToken()
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`)
      }
      return request
    },

    async onResponse({ request, response }) {
      // 401 → try refresh + retry once
      if (response.status === 401 && !isRetrying) {
        isRetrying = true
        try {
          const newToken = await refresh()
          if (newToken) {
            request.headers.set('Authorization', `Bearer ${newToken}`)
            return fetch(new Request(request))
          }
          onAuthFailure()
        } finally {
          isRetrying = false
        }
        return response
      }

      // Toast on non-401 errors
      if (!response.ok && response.status !== 401) {
        try {
          const body = await response.clone().json()
          toast.error(body.message || 'Une erreur est survenue.')
        } catch {
          toast.error('Une erreur est survenue.')
        }
      }

      return response
    },
  }
}
