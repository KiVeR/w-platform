import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeUser, fakeAdminUser, fakeAuthResponse } from '../../helpers/fixtures'

stubAuthGlobals()

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

  function setupPartner() {
    const auth = useAuthStore()
    auth.setAuth(fakeAuthResponse.data)
    return usePartnerStore()
  }

  describe('init', () => {
    it('restores from localStorage for admin', () => {
      localStorageMock.setItem('wellpack-partner-context', JSON.stringify({ id: 42, name: 'Test Partner' }))
      const partner = setupAdmin()
      partner.init()

      expect(partner.currentPartnerId).toBe(42)
      expect(partner.currentPartnerName).toBe('Test Partner')
    })

    it('does nothing for non-admin', () => {
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

    it('is rejected for non-admin', () => {
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
      expect(localStorageMock.getItem('wellpack-partner-context')).toBeNull()
    })

    it('is rejected for non-admin', () => {
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

    it('returns auth.partnerId for non-admin', () => {
      const partner = setupPartner()

      expect(partner.effectivePartnerId).toBe(42)
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
