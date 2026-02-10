import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeUser, fakeAuthResponse } from '../../helpers/fixtures'

const mockApi = {
  POST: vi.fn(),
  GET: vi.fn(),
}

stubAuthGlobals({ $api: mockApi })

const { useAuthStore } = await import('@/stores/auth')

describe('useAuthStore', () => {
  let auth: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    auth = useAuthStore()
  })

  describe('isAuthenticated', () => {
    it('returns false without user or token', () => {
      expect(auth.isAuthenticated).toBe(false)
    })

    it('returns true after setAuth', () => {
      auth.setAuth(fakeAuthResponse.data)
      expect(auth.isAuthenticated).toBe(true)
    })

    it('returns false with user but no token', () => {
      auth.setAuth(fakeAuthResponse.data)
      localStorageMock.clear()
      expect(auth.isAuthenticated).toBe(false)
    })
  })

  describe('setAuth / clearAuth', () => {
    it('saves tokens and user', () => {
      auth.setAuth(fakeAuthResponse.data)

      expect(localStorage.getItem('wellpack-access-token')).toBe('access-123')
      expect(localStorage.getItem('wellpack-refresh-token')).toBe('refresh-456')
      expect(auth.user).toEqual(fakeUser)
    })

    it('clears everything on clearAuth', () => {
      auth.setAuth(fakeAuthResponse.data)
      auth.clearAuth()

      expect(localStorage.getItem('wellpack-access-token')).toBeNull()
      expect(auth.user).toBeNull()
    })
  })

  describe('getters', () => {
    it('returns fullName', () => {
      auth.setAuth(fakeAuthResponse.data)
      expect(auth.fullName).toBe('Jean Dupont')
    })

    it('returns initials', () => {
      auth.setAuth(fakeAuthResponse.data)
      expect(auth.initials).toBe('JD')
    })

    it('returns role', () => {
      auth.setAuth(fakeAuthResponse.data)
      expect(auth.role).toBe('partner')
    })

    it('returns isAdmin false for partner role', () => {
      auth.setAuth(fakeAuthResponse.data)
      expect(auth.isAdmin).toBe(false)
    })

    it('returns isAdmin true for admin role', () => {
      auth.setAuth({
        ...fakeAuthResponse.data,
        user: { ...fakeUser, roles: ['admin'] },
      })
      expect(auth.isAdmin).toBe(true)
    })

    it('returns partnerId', () => {
      auth.setAuth(fakeAuthResponse.data)
      expect(auth.partnerId).toBe(42)
    })
  })

  describe('login', () => {
    it('calls API and sets auth on success', async () => {
      mockApi.POST.mockResolvedValue({ data: fakeAuthResponse, error: undefined })

      await auth.login('jean@test.com', 'password')

      expect(mockApi.POST).toHaveBeenCalledWith('/auth/login', {
        body: { email: 'jean@test.com', password: 'password' },
      })
      expect(auth.user).toEqual(fakeUser)
      expect(auth.isLoading).toBe(false)
    })

    it('sets error on failure', async () => {
      mockApi.POST.mockResolvedValue({ data: undefined, error: { message: 'Invalid credentials.' } })

      await auth.login('bad@test.com', 'wrong')

      expect(auth.error).toBe('Invalid credentials.')
      expect(auth.user).toBeNull()
    })
  })

  describe('loginWithGoogle', () => {
    it('calls social login API and sets auth on success', async () => {
      mockApi.POST.mockResolvedValue({ data: fakeAuthResponse, error: undefined })

      await auth.loginWithGoogle('google-id-token')

      expect(mockApi.POST).toHaveBeenCalledWith('/auth/social/login', {
        body: { provider: 'google', token: 'google-id-token' },
      })
      expect(auth.user).toEqual(fakeUser)
    })

    it('sets error on failure', async () => {
      mockApi.POST.mockResolvedValue({ data: undefined, error: { message: 'Invalid social token.' } })

      await auth.loginWithGoogle('bad-token')

      expect(auth.error).toBe('Invalid social token.')
    })
  })

  describe('fetchMe', () => {
    it('fetches user on success', async () => {
      mockApi.GET.mockResolvedValue({ data: { data: fakeUser }, error: undefined })

      await auth.fetchMe()

      expect(mockApi.GET).toHaveBeenCalledWith('/auth/me')
      expect(auth.user).toEqual(fakeUser)
    })

    it('clears auth on failure', async () => {
      auth.setAuth(fakeAuthResponse.data)
      mockApi.GET.mockResolvedValue({ data: undefined, error: { message: 'Unauthenticated' } })

      await auth.fetchMe()

      expect(auth.user).toBeNull()
    })
  })

  describe('logout', () => {
    it('calls API and clears auth', async () => {
      auth.setAuth(fakeAuthResponse.data)
      mockApi.POST.mockResolvedValue({ data: { message: 'Successfully logged out.' }, error: undefined })

      await auth.logout()

      expect(mockApi.POST).toHaveBeenCalledWith('/auth/logout')
      expect(auth.user).toBeNull()
      expect(localStorage.getItem('wellpack-access-token')).toBeNull()
    })
  })

  describe('init', () => {
    it('calls fetchMe when token exists', async () => {
      localStorage.setItem('wellpack-access-token', 'existing-token')
      mockApi.GET.mockResolvedValue({ data: { data: fakeUser }, error: undefined })

      await auth.init()

      expect(mockApi.GET).toHaveBeenCalledWith('/auth/me')
      expect(auth.user).toEqual(fakeUser)
    })

    it('does not call fetchMe when no token', async () => {
      await auth.init()

      expect(mockApi.GET).not.toHaveBeenCalled()
      expect(auth.user).toBeNull()
    })
  })
})
