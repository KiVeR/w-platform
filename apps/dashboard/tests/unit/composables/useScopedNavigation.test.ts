import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeAdminUser } from '../../helpers/fixtures'

stubAuthGlobals()

let mockRoute = { path: '/', params: {} as Record<string, string> }
vi.stubGlobal('useRoute', () => mockRoute)

const navigateToMock = vi.fn()
vi.stubGlobal('navigateTo', navigateToMock)

const { useAuthStore } = await import('@/stores/auth')
const { usePartnerStore } = await import('@/stores/partner')
const { useScopedNavigation } = await import('@/composables/useScopedNavigation')

describe('useScopedNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    mockRoute = { path: '/', params: {} }
  })

  function setupAdmin() {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })
    return { auth, partner: usePartnerStore() }
  }

  describe('scopedRoute', () => {
    it('prefixes path with /partners/:id when in scope mode', () => {
      setupAdmin()
      mockRoute = { path: '/partners/42/dashboard', params: { id: '42' } }

      const { scopedRoute } = useScopedNavigation()
      expect(scopedRoute('/campaigns')).toBe('/partners/42/campaigns')
    })

    it('returns plain path when in hub mode', () => {
      setupAdmin()

      const { scopedRoute } = useScopedNavigation()
      expect(scopedRoute('/campaigns')).toBe('/campaigns')
    })
  })

  describe('hubRoute', () => {
    it('strips /partners/:id prefix from path', () => {
      setupAdmin()

      const { hubRoute } = useScopedNavigation()
      expect(hubRoute('/partners/42/campaigns')).toBe('/campaigns')
    })

    it('returns /hub/dashboard when stripping leaves empty string', () => {
      setupAdmin()

      const { hubRoute } = useScopedNavigation()
      expect(hubRoute('/partners/42')).toBe('/hub/dashboard')
    })

    it('returns path unchanged when no /partners/:id prefix', () => {
      setupAdmin()

      const { hubRoute } = useScopedNavigation()
      expect(hubRoute('/campaigns')).toBe('/campaigns')
    })
  })

  describe('enterPartner', () => {
    it('navigates to /partners/:id/dashboard', async () => {
      const { partner } = setupAdmin()

      const { enterPartner } = useScopedNavigation()
      await enterPartner(42, 'Test Partner')

      expect(partner.currentPartnerId).toBe(42)
      expect(partner.currentPartnerName).toBe('Test Partner')
      expect(navigateToMock).toHaveBeenCalledWith('/partners/42/dashboard')
    })

    it('navigates without setting partner name when name is omitted', async () => {
      setupAdmin()

      const { enterPartner } = useScopedNavigation()
      await enterPartner(10)

      expect(navigateToMock).toHaveBeenCalledWith('/partners/10/dashboard')
    })
  })

  describe('exitToHub', () => {
    it('clears partner and navigates to /hub/dashboard', async () => {
      const { partner } = setupAdmin()
      partner.setPartner(42, 'Test Partner')

      const { exitToHub } = useScopedNavigation()
      await exitToHub()

      expect(partner.currentPartnerId).toBeNull()
      expect(navigateToMock).toHaveBeenCalledWith('/hub/dashboard')
    })
  })
})
