import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeAdminUser, fakeUser } from '../../helpers/fixtures'

stubAuthGlobals()

const navigateToMock = vi.fn((path: string) => path)
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: Function) => fn)
vi.stubGlobal('usePinia', () => undefined)

const { useAuthStore } = await import('@/stores/auth')
const middleware = (await import('@/middleware/admin')).default as () => string | undefined

describe('admin middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('redirects unauthenticated users to /login', () => {
    middleware()

    expect(navigateToMock).toHaveBeenCalledWith('/login')
  })

  it('redirects authenticated non-admin users to /', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

    middleware()

    expect(navigateToMock).toHaveBeenCalledWith('/')
  })

  it('allows admin users', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })

    const result = middleware()

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
