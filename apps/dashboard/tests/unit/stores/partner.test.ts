import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeUser, fakeAdminUser, fakeAdvUser, fakeAuthResponse } from '../../helpers/fixtures'

const mockApi = { GET: vi.fn(), POST: vi.fn() }
stubAuthGlobals({ $api: mockApi })

const { useAuthStore } = await import('@/stores/auth')
const { usePartnerStore } = await import('@/stores/partner')

describe('usePartnerStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  function setupAdmin() {
    const auth = useAuthStore()
    auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })
    return usePartnerStore()
  }

  function setupAdv() {
    const auth = useAuthStore()
    auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdvUser })
    return usePartnerStore()
  }

  function setupPartner() {
    const auth = useAuthStore()
    auth.setAuth(fakeAuthResponse.data)
    return usePartnerStore()
  }

  describe('canSwitchPartner', () => {
    it('is true for admin', () => {
      const partner = setupAdmin()
      expect(partner.canSwitchPartner).toBe(true)
    })

    it('is true for adv (internal role)', () => {
      const partner = setupAdv()
      expect(partner.canSwitchPartner).toBe(true)
    })

    it('is false for partner (partner-bound role)', () => {
      const partner = setupPartner()
      expect(partner.canSwitchPartner).toBe(false)
    })
  })

  describe('init', () => {
    it('restores from localStorage for admin', () => {
      localStorageMock.setItem('wellpack-partner-context', JSON.stringify({ id: 42, name: 'Test Partner' }))
      const partner = setupAdmin()
      partner.init()

      expect(partner.currentPartnerId).toBe(42)
      expect(partner.currentPartnerName).toBe('Test Partner')
    })

    it('restores from localStorage for adv', () => {
      localStorageMock.setItem('wellpack-partner-context', JSON.stringify({ id: 42, name: 'Test Partner' }))
      const partner = setupAdv()
      partner.init()

      expect(partner.currentPartnerId).toBe(42)
      expect(partner.currentPartnerName).toBe('Test Partner')
    })

    it('does nothing for partner-bound role', () => {
      localStorageMock.setItem('wellpack-partner-context', JSON.stringify({ id: 42, name: 'Test Partner' }))
      const partner = setupPartner()
      partner.init()

      expect(partner.currentPartnerId).toBeNull()
      expect(partner.currentPartnerName).toBeNull()
    })

    it('does nothing when no localStorage data', () => {
      const partner = setupAdmin()
      partner.init()

      expect(partner.currentPartnerId).toBeNull()
    })

    it('clears corrupted localStorage data', () => {
      localStorageMock.setItem('wellpack-partner-context', 'invalid-json')
      const partner = setupAdmin()
      partner.init()

      expect(partner.currentPartnerId).toBeNull()
      expect(localStorageMock.getItem('wellpack-partner-context')).toBeNull()
    })
  })

  describe('setPartner', () => {
    it('updates state and localStorage for admin', () => {
      const partner = setupAdmin()
      partner.setPartner(42, 'Test Partner')

      expect(partner.currentPartnerId).toBe(42)
      expect(partner.currentPartnerName).toBe('Test Partner')
      expect(JSON.parse(localStorageMock.getItem('wellpack-partner-context')!)).toEqual({ id: 42, name: 'Test Partner' })
    })

    it('updates state and localStorage for adv', () => {
      const partner = setupAdv()
      partner.setPartner(42, 'Test Partner')

      expect(partner.currentPartnerId).toBe(42)
      expect(partner.currentPartnerName).toBe('Test Partner')
    })

    it('is rejected for partner-bound role', () => {
      const partner = setupPartner()
      partner.setPartner(42, 'Test Partner')

      expect(partner.currentPartnerId).toBeNull()
      expect(localStorageMock.getItem('wellpack-partner-context')).toBeNull()
    })
  })

  describe('clearPartner', () => {
    it('resets state and localStorage for admin', () => {
      const partner = setupAdmin()
      partner.setPartner(42, 'Test Partner')
      partner.clearPartner()

      expect(partner.currentPartnerId).toBeNull()
      expect(partner.currentPartnerName).toBeNull()
      expect(partner.currentPartnerData).toBeNull()
      expect(localStorageMock.getItem('wellpack-partner-context')).toBeNull()
    })

    it('is rejected for partner-bound role', () => {
      const partner = setupPartner()
      partner.clearPartner()

      expect(partner.currentPartnerId).toBeNull()
    })
  })

  describe('effectivePartnerId', () => {
    it('returns currentPartnerId for admin with selection', () => {
      const partner = setupAdmin()
      partner.setPartner(42, 'Test Partner')

      expect(partner.effectivePartnerId).toBe(42)
    })

    it('returns null for admin without selection', () => {
      const partner = setupAdmin()

      expect(partner.effectivePartnerId).toBeNull()
    })

    it('returns auth.partnerId for partner-bound role', () => {
      const partner = setupPartner()

      expect(partner.effectivePartnerId).toBe(42)
    })

    it('returns currentPartnerId for adv with selection', () => {
      const partner = setupAdv()
      partner.setPartner(10, 'ADV Partner')

      expect(partner.effectivePartnerId).toBe(10)
    })

    it('returns null for adv without selection', () => {
      const partner = setupAdv()

      expect(partner.effectivePartnerId).toBeNull()
    })
  })

  describe('isScoped', () => {
    it('returns true when partner is selected', () => {
      const partner = setupAdmin()
      partner.setPartner(42, 'Test Partner')

      expect(partner.isScoped).toBe(true)
    })

    it('returns false when no partner is selected', () => {
      const partner = setupAdmin()

      expect(partner.isScoped).toBe(false)
    })
  })

  describe('fetchPartnerInfo', () => {
    it('fetches and stores partner data', async () => {
      const partner = setupAdmin()
      mockApi.GET.mockResolvedValue({
        data: { data: { id: 42, name: 'Test Partner', euro_credits: '150.50', is_active: true } },
        error: undefined,
      })

      await partner.fetchPartnerInfo(42)

      expect(mockApi.GET).toHaveBeenCalledWith('/partners/{partner}', {
        params: { path: { partner: 42 } },
      })
      expect(partner.currentPartnerData).toEqual({
        id: 42,
        name: 'Test Partner',
        euro_credits: 150.5,
        is_active: true,
      })
      expect(partner.currentPartnerName).toBe('Test Partner')
    })

    it('does not throw on API error', async () => {
      const partner = setupAdmin()
      mockApi.GET.mockRejectedValue(new Error('Network error'))

      await expect(partner.fetchPartnerInfo(42)).resolves.not.toThrow()
      expect(partner.currentPartnerData).toBeNull()
    })
  })

  describe('clearAuth integration', () => {
    it('clears partner context localStorage on clearAuth', () => {
      const partner = setupAdmin()
      partner.setPartner(42, 'Test Partner')

      const auth = useAuthStore()
      auth.clearAuth()

      expect(localStorageMock.getItem('wellpack-partner-context')).toBeNull()
    })
  })
})
