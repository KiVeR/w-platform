import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { mockUseI18n } from '../../helpers/stubs'
import { fakeAdminUser, fakeUser } from '../../helpers/fixtures'

const mockApi = { GET: vi.fn() }
stubAuthGlobals({ $api: mockApi })
mockUseI18n()
vi.stubGlobal('computed', (fn: () => unknown) => {
  const { computed: vueComputed } = require('vue')
  return vueComputed(fn)
})

const { useAuthStore } = await import('@/stores/auth')
const { usePartnerStore } = await import('@/stores/partner')
const EmptyPortfolioState = (await import('@/components/hub/EmptyPortfolioState.vue')).default
const PartnerInactiveGuard = (await import('@/components/hub/PartnerInactiveGuard.vue')).default

describe('EmptyPortfolioState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('renders empty portfolio message', () => {
    const wrapper = mount(EmptyPortfolioState)

    expect(wrapper.find('[data-empty-portfolio-state]').exists()).toBe(true)
    expect(wrapper.text()).toContain('hub.emptyPortfolio.title')
    expect(wrapper.text()).toContain('hub.emptyPortfolio.description')
  })
})

describe('PartnerInactiveGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('does not render when partner is active', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })
    const partner = usePartnerStore()
    partner.currentPartnerData = { id: 42, name: 'Test', is_active: true }

    const wrapper = mount(PartnerInactiveGuard)
    expect(wrapper.find('[data-partner-inactive-guard]').exists()).toBe(false)
  })

  it('renders warning when partner is inactive', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })
    const partner = usePartnerStore()
    partner.currentPartnerData = { id: 42, name: 'Test', is_active: false }

    const wrapper = mount(PartnerInactiveGuard)
    expect(wrapper.find('[data-partner-inactive-guard]').exists()).toBe(true)
    expect(wrapper.text()).toContain('scope.inactive.title')
  })

  it('shows reactivate button for admin', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })
    const partner = usePartnerStore()
    partner.currentPartnerData = { id: 42, name: 'Test', is_active: false }

    const wrapper = mount(PartnerInactiveGuard)
    expect(wrapper.find('[data-reactivate-btn]').exists()).toBe(true)
  })

  it('hides reactivate button for non-admin', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeUser })
    const partner = usePartnerStore()
    partner.currentPartnerData = { id: 42, name: 'Test', is_active: false }

    const wrapper = mount(PartnerInactiveGuard)
    expect(wrapper.find('[data-reactivate-btn]').exists()).toBe(false)
  })

  it('does not render when currentPartnerData is null', () => {
    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })

    const wrapper = mount(PartnerInactiveGuard)
    expect(wrapper.find('[data-partner-inactive-guard]').exists()).toBe(false)
  })
})
