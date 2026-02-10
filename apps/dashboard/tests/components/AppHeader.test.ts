import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../helpers/auth-stubs'
import { fakeAdminUser, fakeAuthResponse } from '../helpers/fixtures'
import { mockUseI18n } from '../helpers/stubs'

const mockApi = {
  POST: vi.fn(),
  GET: vi.fn(),
}

stubAuthGlobals({ $api: mockApi })

vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()
vi.stubGlobal('useRoute', () => ({ path: '/' }))

const mockToggleSidebar = vi.fn()
vi.mock('@/components/ui/sidebar', () => ({
  useSidebar: () => ({ toggleSidebar: mockToggleSidebar, state: ref('expanded') }),
}))

const { useAuthStore } = await import('@/stores/auth')

const AppHeader = (await import('@/components/layout/AppHeader.vue')).default

const slotStub = { template: '<div><slot /></div>' }
const voidStub = { template: '<div />' }

const headerStubs = {
  Button: { template: '<button v-bind="$attrs"><slot /></button>', inheritAttrs: false },
  Separator: voidStub,
  AppBreadcrumb: { template: '<div data-breadcrumb />' },
  ThemeSwitcher: { template: '<div data-theme-switcher />' },
  PartnerSelector: { template: '<div data-partner-selector />' },
  ChevronsLeft: voidStub,
  Menu: voidStub,
} as Record<string, unknown>

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    mockApi.GET.mockResolvedValue({ data: { data: [] } })
  })

  it('shows PartnerSelector for admin', () => {
    const auth = useAuthStore()
    auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })

    const wrapper = mount(AppHeader, { global: { stubs: headerStubs } })
    expect(wrapper.find('[data-partner-selector]').exists()).toBe(true)
  })

  it('hides PartnerSelector for non-admin', () => {
    const auth = useAuthStore()
    auth.setAuth(fakeAuthResponse.data)

    const wrapper = mount(AppHeader, { global: { stubs: headerStubs } })
    expect(wrapper.find('[data-partner-selector]').exists()).toBe(false)
  })

  it('renders breadcrumb, selector (admin), and theme switcher in order', () => {
    const auth = useAuthStore()
    auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })

    const wrapper = mount(AppHeader, { global: { stubs: headerStubs } })
    const html = wrapper.html()

    const breadcrumbPos = html.indexOf('data-breadcrumb')
    const selectorPos = html.indexOf('data-partner-selector')
    const themePos = html.indexOf('data-theme-switcher')

    expect(breadcrumbPos).toBeLessThan(selectorPos)
    expect(selectorPos).toBeLessThan(themePos)
  })

  it('renders breadcrumb and theme switcher without selector for partner', () => {
    const auth = useAuthStore()
    auth.setAuth(fakeAuthResponse.data)

    const wrapper = mount(AppHeader, { global: { stubs: headerStubs } })
    expect(wrapper.find('[data-breadcrumb]').exists()).toBe(true)
    expect(wrapper.find('[data-theme-switcher]').exists()).toBe(true)
    expect(wrapper.find('[data-partner-selector]').exists()).toBe(false)
  })
})
