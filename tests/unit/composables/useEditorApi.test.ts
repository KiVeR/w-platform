import type { vi } from 'vitest'
import { beforeEach, describe, expect, it } from 'vitest'
import { stubEditorConfig } from '../../helpers/stubs'

const { useEditorApi } = await import('#editor/composables/useEditorApi')

describe('useEditorApi', () => {
  let config: ReturnType<typeof stubEditorConfig>
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    config = stubEditorConfig()
    mockFetch = globalThis.$fetch as ReturnType<typeof vi.fn>
    mockFetch.mockResolvedValue({ ok: true })
  })

  describe('hTTP methods', () => {
    it('gET calls $fetch with method GET', async () => {
      const api = useEditorApi()
      await api.get('/test')
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/test',
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('pOST calls $fetch with method POST', async () => {
      const api = useEditorApi()
      await api.post('/test')
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/test',
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('pUT calls $fetch with method PUT', async () => {
      const api = useEditorApi()
      await api.put('/test')
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/test',
        expect.objectContaining({ method: 'PUT' }),
      )
    })

    it('pATCH calls $fetch with method PATCH', async () => {
      const api = useEditorApi()
      await api.patch('/test')
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/test',
        expect.objectContaining({ method: 'PATCH' }),
      )
    })

    it('dELETE calls $fetch with method DELETE', async () => {
      const api = useEditorApi()
      await api.delete('/test')
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/test',
        expect.objectContaining({ method: 'DELETE' }),
      )
    })
  })

  describe('request configuration', () => {
    it('adds Authorization header when token is present', async () => {
      const api = useEditorApi()
      await api.get('/test')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        }),
      )
    })

    it('does not add Authorization header when getAuthToken returns falsy', async () => {
      stubEditorConfig({ getAuthToken: () => null })
      const api = useEditorApi()
      await api.get('/test')
      const callHeaders = mockFetch.mock.calls[0][1].headers
      expect(callHeaders).not.toHaveProperty('Authorization')
    })

    it('builds URL from apiBaseUrl + endpoint', async () => {
      stubEditorConfig({ apiBaseUrl: 'https://example.com/api' })
      const api = useEditorApi()
      await api.get('/users/123')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/users/123',
        expect.any(Object),
      )
    })

    it('passes credentials: include to $fetch', async () => {
      const api = useEditorApi()
      await api.get('/test')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ credentials: 'include' }),
      )
    })

    it('uses default timeout of 10000ms', async () => {
      const api = useEditorApi()
      await api.get('/test')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ timeout: 10000 }),
      )
    })

    it('passes custom timeout through', async () => {
      const api = useEditorApi()
      await api.get('/test', { timeout: 30000 })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ timeout: 30000 }),
      )
    })
  })

  describe('request body', () => {
    it('pOST passes body to $fetch', async () => {
      const body = { name: 'test', value: 42 }
      const api = useEditorApi()
      await api.post('/items', body)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST', body }),
      )
    })

    it('pUT passes body to $fetch', async () => {
      const body = { name: 'updated' }
      const api = useEditorApi()
      await api.put('/items/1', body)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT', body }),
      )
    })

    it('pATCH passes body to $fetch', async () => {
      const body = { status: 'active' }
      const api = useEditorApi()
      await api.patch('/items/1', body)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH', body }),
      )
    })
  })

  describe('error handling', () => {
    it('calls refreshToken on 401 error', async () => {
      mockFetch
        .mockRejectedValueOnce({ statusCode: 401 })
        .mockResolvedValueOnce({ ok: true })
      const api = useEditorApi()
      await api.get('/protected')
      expect(config.refreshToken).toHaveBeenCalledOnce()
    })

    it('retries request with new token after successful refresh', async () => {
      config.refreshToken.mockResolvedValue('refreshed-token')
      mockFetch
        .mockRejectedValueOnce({ statusCode: 401 })
        .mockResolvedValueOnce({ data: 'success' })
      const api = useEditorApi()
      const result = await api.get('/protected')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ data: 'success' })
    })

    it('calls onAuthFailure and throws when refresh returns null', async () => {
      config.refreshToken.mockResolvedValue(null)
      mockFetch.mockRejectedValueOnce({ statusCode: 401 })
      const api = useEditorApi()

      await expect(api.get('/protected')).rejects.toThrow('Session expired')
      expect(config.onAuthFailure).toHaveBeenCalledOnce()
    })

    it('throws directly on second 401 without calling refresh again', async () => {
      config.refreshToken.mockResolvedValue('refreshed-token')
      mockFetch
        .mockRejectedValueOnce({ statusCode: 401 })
        .mockRejectedValueOnce({ statusCode: 401 })
      const api = useEditorApi()

      await expect(api.get('/protected')).rejects.toEqual({ statusCode: 401 })
      // refreshToken called once for the first 401, not for the retry 401
      expect(config.refreshToken).toHaveBeenCalledOnce()
    })

    it('throws directly on non-401 errors without attempting refresh', async () => {
      const serverError = { statusCode: 500, message: 'Internal Server Error' }
      mockFetch.mockRejectedValueOnce(serverError)
      const api = useEditorApi()

      await expect(api.get('/test')).rejects.toEqual(serverError)
      expect(config.refreshToken).not.toHaveBeenCalled()
    })
  })
})
