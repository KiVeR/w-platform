import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeUser, fakeAdminUser } from '../../helpers/fixtures'

stubAuthGlobals()

const navigateToMock = vi.fn((path: string) => path)
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: Function) => fn)

const { useAuthStore } = await import('@/stores/auth')
const middleware = (await import('@/middleware/role-guard')).default as (
  to: { meta: Record<string, unknown> },
) => string | undefined

const fakeAdvUser = {
  ...fakeUser,
  roles: ['adv' as const],
  permissions: ['view operations' as const, 'manage operations' as const, 'transition operations' as const],
}

describe('role-guard middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('does nothing when no requirements set', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

    const result = middleware({ meta: {} })

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('allows admin regardless of required roles', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })

    const result = middleware({ meta: { requiredRoles: ['adv'] } })

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('allows admin regardless of required permissions', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })

    const result = middleware({ meta: { requiredPermissions: ['view operations'] } })

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('redirects when user lacks required role', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser }) // partner role

    middleware({ meta: { requiredRoles: ['adv'] } })

    expect(navigateToMock).toHaveBeenCalledWith('/campaigns')
  })

  it('allows user with matching required role', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdvUser })

    const result = middleware({ meta: { requiredRoles: ['adv', 'programmer'] } })

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('redirects when user lacks required permission', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser }) // no 'view operations'

    middleware({ meta: { requiredPermissions: ['view operations'] } })

    expect(navigateToMock).toHaveBeenCalledWith('/campaigns')
  })

  it('allows user with required permission', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdvUser })

    const result = middleware({ meta: { requiredPermissions: ['view operations'] } })

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('redirects to defaultRoute based on primary role', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser }) // partner → /campaigns

    middleware({ meta: { requiredPermissions: ['view operations'] } })

    expect(navigateToMock).toHaveBeenCalledWith('/campaigns')
  })
})
