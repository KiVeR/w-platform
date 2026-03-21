import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeUser, fakeAdminUser } from '../../helpers/fixtures'

const mockApi = { POST: vi.fn(), GET: vi.fn() }
stubAuthGlobals({ $api: mockApi })

const { useAuthStore } = await import('@/stores/auth')

describe('auth store — role priority & defaultRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('primaryRole picks admin over partner when multi-role', () => {
    const auth = useAuthStore()
    auth.setAuth({
      access_token: 'tok',
      refresh_token: 'ref',
      user: { ...fakeUser, roles: ['partner', 'admin'] },
    })
    expect(auth.primaryRole).toBe('admin')
  })

  it('primaryRole picks adv over partner', () => {
    const auth = useAuthStore()
    auth.setAuth({
      access_token: 'tok',
      refresh_token: 'ref',
      user: { ...fakeUser, roles: ['partner', 'adv'] },
    })
    expect(auth.primaryRole).toBe('adv')
  })

  it('role is an alias for primaryRole', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })
    expect(auth.role).toBe(auth.primaryRole)
  })

  it('defaultRoute is /campaigns for partner', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })
    expect(auth.defaultRoute).toBe('/campaigns')
  })

  it('defaultRoute is /operations for adv', () => {
    const auth = useAuthStore()
    auth.setAuth({
      access_token: 'tok',
      refresh_token: 'ref',
      user: { ...fakeUser, roles: ['adv'] },
    })
    expect(auth.defaultRoute).toBe('/operations')
  })

  it('defaultRoute is / for admin', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })
    expect(auth.defaultRoute).toBe('/')
  })

  it('defaultRoute is / for unknown role', () => {
    const auth = useAuthStore()
    auth.setAuth({
      access_token: 'tok',
      refresh_token: 'ref',
      user: { ...fakeUser, roles: ['employee'] },
    })
    expect(auth.defaultRoute).toBe('/')
  })

  it('hasPermission returns true when user holds the permission', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })
    expect(auth.hasPermission('view campaigns')).toBe(true)
  })

  it('hasPermission returns false when user lacks the permission', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })
    expect(auth.hasPermission('view operations')).toBe(false)
  })

  it('isAdmin remains true when admin is highest priority role', () => {
    const auth = useAuthStore()
    auth.setAuth({
      access_token: 'tok',
      refresh_token: 'ref',
      user: { ...fakeAdminUser, roles: ['admin', 'partner'] },
    })
    expect(auth.isAdmin).toBe(true)
  })
})
