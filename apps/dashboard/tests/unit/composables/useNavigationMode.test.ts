import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeUser, fakeAdminUser } from '../../helpers/fixtures'

stubAuthGlobals()

let mockRoute = { path: '/', params: {} as Record<string, string> }
vi.stubGlobal('useRoute', () => mockRoute)

const { useAuthStore } = await import('@/stores/auth')
const { useNavigationMode } = await import('@/composables/useNavigationMode')

describe('useNavigationMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    mockRoute = { path: '/', params: {} }
  })

  describe('partner-bound roles', () => {
    it('returns scope mode for partner role regardless of URL', () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

      const { mode, isScope, isHub } = useNavigationMode()
      expect(mode.value).toBe('scope')
      expect(isScope.value).toBe(true)
      expect(isHub.value).toBe(false)
    })

    it('returns scope mode for merchant role', () => {
      const auth = useAuthStore()
      auth.setAuth({
        access_token: 'tok',
        refresh_token: 'ref',
        user: { ...fakeUser, roles: ['merchant' as const] },
      })

      const { mode } = useNavigationMode()
      expect(mode.value).toBe('scope')
    })

    it('returns scope mode for employee role', () => {
      const auth = useAuthStore()
      auth.setAuth({
        access_token: 'tok',
        refresh_token: 'ref',
        user: { ...fakeUser, roles: ['employee' as const] },
      })

      const { mode } = useNavigationMode()
      expect(mode.value).toBe('scope')
    })

    it('scopedPartnerId is null for partner-bound on non-partner URL', () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

      const { scopedPartnerId } = useNavigationMode()
      expect(scopedPartnerId.value).toBeNull()
    })
  })

  describe('internal roles', () => {
    it('returns hub mode for admin on non-partner URL', () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })

      const { mode, isHub } = useNavigationMode()
      expect(mode.value).toBe('hub')
      expect(isHub.value).toBe(true)
    })

    it('returns scope mode for admin on /partners/:id URL', () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })
      mockRoute = { path: '/partners/42/dashboard', params: { id: '42' } }

      const { mode, isScope, scopedPartnerId } = useNavigationMode()
      expect(mode.value).toBe('scope')
      expect(isScope.value).toBe(true)
      expect(scopedPartnerId.value).toBe(42)
    })

    it('returns hub mode for adv on non-partner URL', () => {
      const auth = useAuthStore()
      auth.setAuth({
        access_token: 'tok',
        refresh_token: 'ref',
        user: { ...fakeAdminUser, roles: ['adv' as const] },
      })

      const { mode } = useNavigationMode()
      expect(mode.value).toBe('hub')
    })

    it('returns scope mode for adv on /partners/:id URL', () => {
      const auth = useAuthStore()
      auth.setAuth({
        access_token: 'tok',
        refresh_token: 'ref',
        user: { ...fakeAdminUser, roles: ['adv' as const] },
      })
      mockRoute = { path: '/partners/10/campaigns', params: { id: '10' } }

      const { mode, scopedPartnerId } = useNavigationMode()
      expect(mode.value).toBe('scope')
      expect(scopedPartnerId.value).toBe(10)
    })
  })

  describe('scopedPartnerId edge cases', () => {
    it('returns null when path has /partners/ but no params.id', () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })
      mockRoute = { path: '/partners/', params: {} }

      const { scopedPartnerId } = useNavigationMode()
      expect(scopedPartnerId.value).toBeNull()
    })

    it('returns null when params.id exists but path does not start with /partners/', () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })
      mockRoute = { path: '/campaigns/42', params: { id: '42' } }

      const { scopedPartnerId } = useNavigationMode()
      expect(scopedPartnerId.value).toBeNull()
    })
  })
})
