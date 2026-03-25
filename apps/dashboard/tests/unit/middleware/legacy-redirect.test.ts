import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeUser, fakeAdminUser, fakeAdvUser } from '../../helpers/fixtures'

stubAuthGlobals()

const navigateToMock = vi.fn((path: string) => path)
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: Function) => fn)
vi.stubGlobal('usePinia', () => undefined)

const { useAuthStore } = await import('@/stores/auth')
const middleware = (await import('@/middleware/legacy-redirect.global')).default as (
  to: { path: string },
) => string | undefined

describe('legacy-redirect middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  function authAs(userData: typeof fakeUser) {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: userData })
    return auth
  }

  it('redirects admin on /campaigns to /hub/dashboard', () => {
    authAs(fakeAdminUser)

    middleware({ path: '/campaigns' })

    expect(navigateToMock).toHaveBeenCalledWith('/hub/dashboard')
  })

  it('redirects admin on /campaigns/new to /hub/dashboard', () => {
    authAs(fakeAdminUser)

    middleware({ path: '/campaigns/new' })

    expect(navigateToMock).toHaveBeenCalledWith('/hub/dashboard')
  })

  it('does NOT redirect adv on /billing (global listing like demandes)', () => {
    authAs(fakeAdvUser)

    const result = middleware({ path: '/billing' })

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('redirects admin on /shops to /hub/dashboard', () => {
    authAs(fakeAdminUser)

    middleware({ path: '/shops' })

    expect(navigateToMock).toHaveBeenCalledWith('/hub/dashboard')
  })

  it('redirects admin on /landing-pages to /hub/dashboard', () => {
    authAs(fakeAdminUser)

    middleware({ path: '/landing-pages' })

    expect(navigateToMock).toHaveBeenCalledWith('/hub/dashboard')
  })

  it('does NOT redirect partner on /campaigns', () => {
    authAs(fakeUser)

    const result = middleware({ path: '/campaigns' })

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('does NOT redirect admin on /demandes (global listing)', () => {
    authAs(fakeAdminUser)

    const result = middleware({ path: '/demandes' })

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('does NOT redirect admin on /operations (global listing)', () => {
    authAs(fakeAdminUser)

    const result = middleware({ path: '/operations' })

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('does NOT redirect admin on /hub/dashboard', () => {
    authAs(fakeAdminUser)

    const result = middleware({ path: '/hub/dashboard' })

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('does NOT redirect admin on scoped route /partners/42/campaigns', () => {
    authAs(fakeAdminUser)

    const result = middleware({ path: '/partners/42/campaigns' })

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('does NOT redirect unauthenticated users (let auth middleware handle)', () => {
    // No auth setup → isAuthenticated = false
    const result = middleware({ path: '/campaigns' })

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
