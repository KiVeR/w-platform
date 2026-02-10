import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeAdminUser, fakeAuthResponse } from '../../helpers/fixtures'

stubAuthGlobals()

const { useAuthStore } = await import('@/stores/auth')
const { usePartnerStore } = await import('@/stores/partner')
const { usePartnerScope } = await import('@/composables/usePartnerScope')

describe('usePartnerScope', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  function setupAdmin(withSelection = false) {
    const auth = useAuthStore()
    auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })
    const partner = usePartnerStore()
    if (withSelection) {
      partner.setPartner(42, 'Test Partner')
    }
    return usePartnerScope()
  }

  function setupPartner() {
    const auth = useAuthStore()
    auth.setAuth(fakeAuthResponse.data)
    return usePartnerScope()
  }

  describe('withPartnerScope', () => {
    it('adds filter for admin with selection', () => {
      const { withPartnerScope } = setupAdmin(true)
      const result = withPartnerScope({ sort: '-created_at' })

      expect(result).toEqual({ sort: '-created_at', 'filter[partner_id]': 42 })
    })

    it('does not add filter for admin without selection', () => {
      const { withPartnerScope } = setupAdmin(false)
      const result = withPartnerScope({ sort: '-created_at' })

      expect(result).toEqual({ sort: '-created_at' })
    })

    it('adds filter for non-admin using auth.partnerId', () => {
      const { withPartnerScope } = setupPartner()
      const result = withPartnerScope({ sort: '-created_at' })

      expect(result).toEqual({ sort: '-created_at', 'filter[partner_id]': 42 })
    })

    it('preserves existing params', () => {
      const { withPartnerScope } = setupAdmin(true)
      const result = withPartnerScope({ page: 1, 'filter[status]': 'active' })

      expect(result).toEqual({ page: 1, 'filter[status]': 'active', 'filter[partner_id]': 42 })
    })

    it('returns empty params when no scope and no selection', () => {
      const { withPartnerScope } = setupAdmin(false)
      const result = withPartnerScope()

      expect(result).toEqual({})
    })
  })

})
