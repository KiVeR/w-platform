import { describe, it, expect, beforeEach, vi } from 'vitest'
import { localStorageMock } from '../../helpers/auth-stubs'

vi.stubGlobal('localStorage', localStorageMock)
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { apiUrl: 'http://localhost:8000' },
}))
vi.stubGlobal('fetch', vi.fn())

const { tokenRefreshManager, STORAGE_KEYS } = await import('@/services/tokenRefreshManager')

describe('tokenRefreshManager', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset()
    localStorageMock.clear()
  })

  describe('getAccessToken', () => {
    it('returns token from localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'my-token')
      expect(tokenRefreshManager.getAccessToken()).toBe('my-token')
    })

    it('returns null when no token stored', () => {
      expect(tokenRefreshManager.getAccessToken()).toBeNull()
    })
  })

  describe('saveTokens', () => {
    it('writes access and refresh tokens to localStorage', () => {
      tokenRefreshManager.saveTokens({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
      })

      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('new-access')
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('new-refresh')
    })
  })

  describe('clearTokens', () => {
    it('removes all tokens from localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access')
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh')

      tokenRefreshManager.clearTokens()

      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull()
    })
  })

  describe('refreshToken', () => {
    it('returns null and does not fetch when no refresh token', async () => {
      const result = await tokenRefreshManager.refreshToken()

      expect(result).toBeNull()
      expect(fetch).not.toHaveBeenCalled()
    })

    it('refreshes successfully and saves new tokens', async () => {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'old-refresh')

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({
          data: {
            access_token: 'new-access',
            token_type: 'Bearer',
            expires_in: 86400,
            refresh_token: 'new-refresh',
          },
        }), { status: 200 }),
      )

      const result = await tokenRefreshManager.refreshToken()

      expect(result).toBe('new-access')
      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('new-access')
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('new-refresh')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refresh_token: 'old-refresh' }),
        }),
      )
    })

    it('clears tokens and calls failure handlers on non-200 response', async () => {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'bad-refresh')
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'old-access')

      const failureHandler = vi.fn()
      tokenRefreshManager.onRefreshFailure(failureHandler)

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 }),
      )

      const result = await tokenRefreshManager.refreshToken()

      expect(result).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull()
      expect(failureHandler).toHaveBeenCalledOnce()
    })

    it('deduplicates concurrent refresh requests', async () => {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh')

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({
          data: {
            access_token: 'deduped-token',
            refresh_token: 'new-refresh',
            expires_in: 86400,
          },
        }), { status: 200 }),
      )

      const [r1, r2, r3] = await Promise.all([
        tokenRefreshManager.refreshToken(),
        tokenRefreshManager.refreshToken(),
        tokenRefreshManager.refreshToken(),
      ])

      expect(r1).toBe('deduped-token')
      expect(r2).toBe('deduped-token')
      expect(r3).toBe('deduped-token')
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('onRefreshFailure', () => {
    it('invokes all registered failure handlers on failure', async () => {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'token')

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response('', { status: 401 }),
      )

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      tokenRefreshManager.onRefreshFailure(handler1)
      tokenRefreshManager.onRefreshFailure(handler2)

      await tokenRefreshManager.refreshToken()

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('returns unsubscribe function that removes handler', async () => {
      const handler = vi.fn()
      const unsub = tokenRefreshManager.onRefreshFailure(handler)

      unsub()

      // Trigger failure
      await tokenRefreshManager.refreshToken()

      expect(handler).not.toHaveBeenCalled()
    })
  })
})
