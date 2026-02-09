import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createAuthMiddleware } from '@/services/apiMiddleware'

// Mock vue-sonner
vi.mock('vue-sonner', () => ({
  toast: { error: vi.fn() },
}))

import { toast } from 'vue-sonner'

describe('createAuthMiddleware', () => {
  const getToken = vi.fn()
  const refresh = vi.fn()
  const onAuthFailure = vi.fn()
  let middleware: ReturnType<typeof createAuthMiddleware>

  beforeEach(() => {
    vi.clearAllMocks()
    middleware = createAuthMiddleware(getToken, refresh, onAuthFailure)
  })

  describe('onRequest', () => {
    it('adds Authorization header when token exists', async () => {
      getToken.mockReturnValue('my-token')
      const request = new Request('http://localhost/api/me')

      const result = await middleware.onRequest!({
        request,
        schemaPath: '/auth/me',
        options: {},
        id: 'test',
        params: {},
      })

      expect((result as Request).headers.get('Authorization')).toBe('Bearer my-token')
    })

    it('does not add header when no token', async () => {
      getToken.mockReturnValue(null)
      const request = new Request('http://localhost/api/me')

      const result = await middleware.onRequest!({
        request,
        schemaPath: '/auth/me',
        options: {},
        id: 'test',
        params: {},
      })

      expect((result as Request).headers.has('Authorization')).toBe(false)
    })
  })

  describe('onResponse', () => {
    function makeCtx(response: Response, request?: Request) {
      return {
        request: request ?? new Request('http://localhost/api/test'),
        response,
        schemaPath: '/test' as const,
        options: {},
        id: 'test',
        params: {},
      }
    }

    it('shows toast on non-401 error with message', async () => {
      const response = new Response(
        JSON.stringify({ message: 'Validation failed' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      )

      await middleware.onResponse!(makeCtx(response))

      expect(toast.error).toHaveBeenCalledWith('Validation failed')
    })

    it('shows default toast when no message in body', async () => {
      const response = new Response('Internal Error', { status: 500 })

      await middleware.onResponse!(makeCtx(response))

      expect(toast.error).toHaveBeenCalledWith('Une erreur est survenue.')
    })

    it('does not show toast on 401', async () => {
      refresh.mockResolvedValue(null)
      const response = new Response('', { status: 401 })

      await middleware.onResponse!(makeCtx(response))

      expect(toast.error).not.toHaveBeenCalled()
    })

    it('does not show toast on success', async () => {
      const response = new Response('{}', { status: 200 })

      await middleware.onResponse!(makeCtx(response))

      expect(toast.error).not.toHaveBeenCalled()
    })

    it('calls refresh on 401 and retries with new token', async () => {
      refresh.mockResolvedValue('refreshed-token')

      const retryResponse = new Response('{"data":"ok"}', { status: 200 })
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(retryResponse))

      const request = new Request('http://localhost/api/me', {
        headers: { Authorization: 'Bearer expired' },
      })
      const response = new Response('', { status: 401 })

      const result = await middleware.onResponse!(makeCtx(response, request))

      expect(refresh).toHaveBeenCalledOnce()
      expect(fetch).toHaveBeenCalledOnce()
      expect(result).toBe(retryResponse)
    })

    it('calls onAuthFailure when refresh returns null', async () => {
      refresh.mockResolvedValue(null)

      const response = new Response('', { status: 401 })

      await middleware.onResponse!(makeCtx(response))

      expect(refresh).toHaveBeenCalledOnce()
      expect(onAuthFailure).toHaveBeenCalledOnce()
    })
  })
})
