import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeUser } from '../../helpers/fixtures'

stubAuthGlobals()

const { useAuthStore } = await import('@/stores/auth')
const { usePermission } = await import('@/composables/usePermission')

describe('usePermission', () => {
  beforeEach(() => {
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  describe('can', () => {
    it('returns true when user has permission', () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

      const { can } = usePermission()
      expect(can('view campaigns')).toBe(true)
    })

    it('returns false when user lacks permission', () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

      const { can } = usePermission()
      expect(can('manage partners')).toBe(false)
    })

    it('returns false when no user', () => {
      const { can } = usePermission()
      expect(can('view campaigns')).toBe(false)
    })
  })

  describe('hasRole', () => {
    it('returns true when user has role', () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

      const { hasRole } = usePermission()
      expect(hasRole('partner')).toBe(true)
    })

    it('returns false when user lacks role', () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

      const { hasRole } = usePermission()
      expect(hasRole('admin')).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    it('returns true when user has at least one role', () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

      const { hasAnyRole } = usePermission()
      expect(hasAnyRole(['admin', 'partner'])).toBe(true)
    })

    it('returns false when user has none of the roles', () => {
      const auth = useAuthStore()
      auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })

      const { hasAnyRole } = usePermission()
      expect(hasAnyRole(['admin', 'merchant'])).toBe(false)
    })
  })
})
