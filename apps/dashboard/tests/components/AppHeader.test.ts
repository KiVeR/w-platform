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

let mockRoute = { path: '/hub/dashboard', params: {} as Record<string, string> }
vi.stubGlobal('useRoute', () => mockRoute)
vi.stubGlobal('navigateTo', vi.fn())

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
  ScopeBanner: { template: '<div data-scope-banner />' },
  ChevronsLeft: voidStub,
  Menu: voidStub,
} as Record<string, unknown>

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    mockApi.GET.mockResolvedValue({ data: { data: [] } })
    mockRoute = { path: '/hub/dashboard', params: {} }
  })

  it('shows ScopeBanner for admin in scope mode', () => {
    const auth = useAuthStore()
    auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })
    mockRoute = { path: '/partners/42/dashboard', params: { id: '42' } }

    const wrapper = mount(AppHeader, { global: { stubs: headerStubs } })
    expect(wrapper.find('[data-scope-banner]').exists()).toBe(true)
  })

  it('hides ScopeBanner for admin in hub mode', () => {
    const auth = useAuthStore()
    auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })

    const wrapper = mount(AppHeader, { global: { stubs: headerStubs } })
    expect(wrapper.find('[data-scope-banner]').exists()).toBe(false)
  })

  it('hides ScopeBanner for partner-bound user (always in scope but no banner needed)', () => {
    const auth = useAuthStore()
    auth.setAuth(fakeAuthResponse.data)

    const wrapper = mount(AppHeader, { global: { stubs: headerStubs } })
    expect(wrapper.find('[data-scope-banner]').exists()).toBe(false)
  })

  it('renders breadcrumb and theme switcher', () => {
    const auth = useAuthStore()
    auth.setAuth(fakeAuthResponse.data)

    const wrapper = mount(AppHeader, { global: { stubs: headerStubs } })
    expect(wrapper.find('[data-breadcrumb]').exists()).toBe(true)
    expect(wrapper.find('[data-theme-switcher]').exists()).toBe(true)
  })

  it('renders breadcrumb, scope banner, and theme switcher in order for scoped admin', () => {
    const auth = useAuthStore()
    auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })
    mockRoute = { path: '/partners/42/dashboard', params: { id: '42' } }

    const wrapper = mount(AppHeader, { global: { stubs: headerStubs } })
    const html = wrapper.html()

    const breadcrumbPos = html.indexOf('data-breadcrumb')
    const bannerPos = html.indexOf('data-scope-banner')
    const themePos = html.indexOf('data-theme-switcher')

    expect(breadcrumbPos).toBeLessThan(bannerPos)
    expect(bannerPos).toBeLessThan(themePos)
  })
})
