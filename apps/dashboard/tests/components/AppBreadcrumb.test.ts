import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computed } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../helpers/auth-stubs'
import { NuxtLinkStub, mockUseI18n } from '../helpers/stubs'
import { fakeAdminUser, fakeAuthResponse } from '../helpers/fixtures'

stubAuthGlobals()

vi.stubGlobal('computed', computed)
mockUseI18n()

let mockRoute: { path: string; params: Record<string, string>; meta: Record<string, unknown> } = {
  path: '/',
  params: {},
  meta: {},
}
vi.stubGlobal('useRoute', () => mockRoute)

const { useAuthStore } = await import('@/stores/auth')
const { usePartnerStore } = await import('@/stores/partner')

const AppBreadcrumb = (await import('@/components/layout/AppBreadcrumb.vue')).default

const slotStub = { template: '<div><slot /></div>' }

describe('AppBreadcrumb', () => {
  beforeEach(() => {
    localStorageMock.clear()
    setActivePinia(createPinia())
    mockRoute = { path: '/', params: {}, meta: {} }
  })

  function mountBreadcrumb() {
    return mount(AppBreadcrumb, {
      global: {
        stubs: {
          NuxtLink: NuxtLinkStub,
          Breadcrumb: slotStub,
          BreadcrumbItem: slotStub,
          BreadcrumbLink: slotStub,
          BreadcrumbList: slotStub,
          BreadcrumbPage: slotStub,
          BreadcrumbSeparator: slotStub,
        },
      },
    })
  }

  it('renders dashboard breadcrumb on root route', () => {
    const wrapper = mountBreadcrumb()
    expect(wrapper.text()).toContain('breadcrumb.dashboard')
  })

  it('renders admin breadcrumb segments for variable schemas page', () => {
    mockRoute = { path: '/admin/variable-schemas', params: {}, meta: {} }

    const wrapper = mountBreadcrumb()

    expect(wrapper.text()).toContain('breadcrumb.dashboard')
    expect(wrapper.text()).toContain('breadcrumb.admin')
    expect(wrapper.text()).toContain('breadcrumb.variableSchemas')
  })

  it('renders hub breadcrumb for hub/dashboard path', () => {
    mockRoute = { path: '/hub/dashboard', params: {}, meta: {} }

    const wrapper = mountBreadcrumb()

    expect(wrapper.text()).toContain('breadcrumb.dashboard')
    expect(wrapper.text()).toContain('breadcrumb.hub')
  })

  describe('scope mode breadcrumb', () => {
    it('renders Hub > PartnerName > Page in scope mode', () => {
      const auth = useAuthStore()
      auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })
      const partner = usePartnerStore()
      partner.setPartner(42, 'Test Partner')

      mockRoute = { path: '/partners/42/campaigns', params: { id: '42' }, meta: {} }

      const wrapper = mountBreadcrumb()

      expect(wrapper.text()).toContain('breadcrumb.hub')
      expect(wrapper.text()).toContain('Test Partner')
      expect(wrapper.text()).toContain('breadcrumb.campaigns')
    })

    it('uses partner ID when name is not available', () => {
      const auth = useAuthStore()
      auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })
      // Don't set partner name

      mockRoute = { path: '/partners/42/dashboard', params: { id: '42' }, meta: {} }

      const wrapper = mountBreadcrumb()

      expect(wrapper.text()).toContain('breadcrumb.hub')
      expect(wrapper.text()).toContain('#42')
      expect(wrapper.text()).toContain('breadcrumb.dashboard')
    })

    it('shows only Hub > PartnerName for partner dashboard', () => {
      const auth = useAuthStore()
      auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })
      const partner = usePartnerStore()
      partner.setPartner(42, 'Test Partner')

      mockRoute = { path: '/partners/42/dashboard', params: { id: '42' }, meta: {} }

      const wrapper = mountBreadcrumb()

      expect(wrapper.text()).toContain('breadcrumb.hub')
      expect(wrapper.text()).toContain('Test Partner')
      expect(wrapper.text()).toContain('breadcrumb.dashboard')
    })
  })
})
