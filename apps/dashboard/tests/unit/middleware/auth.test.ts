import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeUser, fakeAdminUser } from '../../helpers/fixtures'

stubAuthGlobals()

// Mock Nuxt route middleware helpers
const navigateToMock = vi.fn((path: string) => path)
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: Function) => fn)
vi.stubGlobal('usePinia', () => undefined)

const { useAuthStore } = await import('@/stores/auth')
const middleware = (await import('@/middleware/auth.global')).default as (
  to: { path: string },
  from: { path: string },
) => string | undefined

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('redirects to /login when not authenticated on protected route', () => {
    middleware({ path: '/campaigns' }, { path: '/' })

    expect(navigateToMock).toHaveBeenCalledWith('/login')
  })

  it('allows access to /login when not authenticated', () => {
    const result = middleware({ path: '/login' }, { path: '/' })

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('allows access to protected route when authenticated', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

    const result = middleware({ path: '/campaigns' }, { path: '/' })

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('redirects to defaultRoute when authenticated user visits /login', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

    middleware({ path: '/login' }, { path: '/' })

    expect(navigateToMock).toHaveBeenCalledWith('/campaigns')
  })

  it('redirects admin from /login to /hub/dashboard', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })

    middleware({ path: '/login' }, { path: '/' })

    expect(navigateToMock).toHaveBeenCalledWith('/hub/dashboard')
  })

  it('redirects bare / to defaultRoute for partner', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

    middleware({ path: '/' }, { path: '/login' })

    expect(navigateToMock).toHaveBeenCalledWith('/campaigns')
  })

  it('redirects bare / to /hub/dashboard for admin', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })

    middleware({ path: '/' }, { path: '/login' })

    expect(navigateToMock).toHaveBeenCalledWith('/hub/dashboard')
  })
})
