import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeUser, fakeAdminUser, fakeAdvUser } from '../../helpers/fixtures'

const mockApi = { GET: vi.fn(), POST: vi.fn() }
stubAuthGlobals({ $api: mockApi })

const navigateToMock = vi.fn((path: string) => path)
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: Function) => fn)
vi.stubGlobal('usePinia', () => undefined)

const { useAuthStore } = await import('@/stores/auth')
const middleware = (await import('@/middleware/scope-guard')).default as (
  to: { path: string; params: Record<string, string> },
  from: { path: string },
) => Promise<string | undefined>

describe('scope-guard middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    mockApi.GET.mockReset()
  })

  describe('invalid partner id', () => {
    it('redirects to defaultRoute when id is missing', async () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })

      await middleware(
        { path: '/partners/', params: {} },
        { path: '/' },
      )

      expect(navigateToMock).toHaveBeenCalledWith('/hub/dashboard')
    })

    it('redirects to defaultRoute when id is NaN', async () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })

      await middleware(
        { path: '/partners/abc', params: { id: 'abc' } },
        { path: '/' },
      )

      expect(navigateToMock).toHaveBeenCalledWith('/hub/dashboard')
    })
  })

  describe('partner-bound users', () => {
    it('allows access to own partner', async () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

      const result = await middleware(
        { path: '/partners/42/dashboard', params: { id: '42' } },
        { path: '/' },
      )

      expect(result).toBeUndefined()
      expect(navigateToMock).not.toHaveBeenCalled()
      // Should not call API for partner-bound fast path
      expect(mockApi.GET).not.toHaveBeenCalled()
    })

    it('redirects when accessing another partner', async () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

      await middleware(
        { path: '/partners/99/dashboard', params: { id: '99' } },
        { path: '/' },
      )

      expect(navigateToMock).toHaveBeenCalledWith('/campaigns')
    })
  })

  describe('internal roles', () => {
    it('allows admin access when API returns success', async () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })
      mockApi.GET.mockResolvedValue({ data: { data: { id: 42, name: 'Test' } }, error: undefined })

      const result = await middleware(
        { path: '/partners/42/dashboard', params: { id: '42' } },
        { path: '/' },
      )

      expect(result).toBeUndefined()
      expect(navigateToMock).not.toHaveBeenCalled()
      expect(mockApi.GET).toHaveBeenCalledWith('/partners/{partner}', {
        params: { path: { partner: 42 } },
      })
    })

    it('redirects admin when API returns error', async () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })
      mockApi.GET.mockResolvedValue({ data: undefined, error: { status: 404 } })

      await middleware(
        { path: '/partners/999/dashboard', params: { id: '999' } },
        { path: '/' },
      )

      expect(navigateToMock).toHaveBeenCalledWith('/hub/dashboard')
    })

    it('allows ADV access when API returns success', async () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdvUser })
      mockApi.GET.mockResolvedValue({ data: { data: { id: 10, name: 'ADV Partner' } }, error: undefined })

      const result = await middleware(
        { path: '/partners/10/dashboard', params: { id: '10' } },
        { path: '/' },
      )

      expect(result).toBeUndefined()
      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('redirects ADV when API returns 403', async () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdvUser })
      mockApi.GET.mockResolvedValue({ data: undefined, error: { status: 403 } })

      await middleware(
        { path: '/partners/99/dashboard', params: { id: '99' } },
        { path: '/' },
      )

      expect(navigateToMock).toHaveBeenCalledWith('/hub/dashboard')
    })
  })
})
