import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computed, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../helpers/auth-stubs'
import { NuxtLinkStub, mockUseI18n } from '../helpers/stubs'
import { fakeAdminUser, fakeAdvUser, fakeAuthResponse } from '../helpers/fixtures'

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

vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
})

const { useAuthStore } = await import('@/stores/auth')
const { usePartnerStore } = await import('@/stores/partner')

const AppSidebar = (await import('@/components/layout/AppSidebar.vue')).default

const slotStub = { template: '<div><slot /></div>' }
const voidStub = { template: '<div />' }

const sidebarStubs = {
  NuxtLink: NuxtLinkStub,
  AppLogo: voidStub,
  Badge: { template: '<span data-badge><slot /></span>' },
  Sidebar: slotStub,
  SidebarContent: slotStub,
  SidebarFooter: slotStub,
  SidebarGroup: { template: '<div v-bind="$attrs"><slot /></div>', inheritAttrs: false },
  SidebarGroupContent: slotStub,
  SidebarGroupLabel: slotStub,
  SidebarHeader: slotStub,
  SidebarMenu: slotStub,
  SidebarMenuButton: slotStub,
  SidebarMenuItem: slotStub,
  SidebarRail: voidStub,
  SidebarSeparator: voidStub,
  DropdownMenu: slotStub,
  DropdownMenuContent: slotStub,
  DropdownMenuItem: {
    template: '<button data-dropdown-item v-bind="$attrs"><slot /></button>',
    inheritAttrs: false,
  },
  DropdownMenuSeparator: voidStub,
  DropdownMenuTrigger: slotStub,
  Avatar: slotStub,
  AvatarFallback: { template: '<span><slot /></span>' },
} as Record<string, unknown>

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    mockRoute = { path: '/hub/dashboard', params: {} }
  })

  function mountSidebar() {
    const auth = useAuthStore()
    auth.setAuth(fakeAuthResponse.data)
    return mount(AppSidebar, { global: { stubs: sidebarStubs } })
  }

  function mountAdminHub() {
    const auth = useAuthStore()
    auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })
    mockRoute = { path: '/hub/dashboard', params: {} }
    return mount(AppSidebar, { global: { stubs: sidebarStubs } })
  }

  function mountAdminScope() {
    const auth = useAuthStore()
    auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })
    mockRoute = { path: '/partners/42/dashboard', params: { id: '42' } }
    return mount(AppSidebar, { global: { stubs: sidebarStubs } })
  }

  it('displays name and email from auth store', () => {
    const wrapper = mountSidebar()
    expect(wrapper.text()).toContain('Jean Dupont')
    expect(wrapper.text()).toContain('jean@test.com')
  })

  it('displays initials in avatar', () => {
    const wrapper = mountSidebar()
    expect(wrapper.text()).toContain('JD')
  })

  it('logout calls auth.logout and navigates to /login', async () => {
    const wrapper = mountSidebar()
    const auth = useAuthStore()
    const logoutSpy = vi.spyOn(auth, 'logout').mockResolvedValue()

    const buttons = wrapper.findAll('button[data-dropdown-item]')
    const logoutBtn = buttons.find(b => b.text().includes('sidebar.logout'))
    expect(logoutBtn).toBeTruthy()
    await logoutBtn!.trigger('click')
    await flushPromises()

    expect(logoutSpy).toHaveBeenCalled()
    expect(navigateTo).toHaveBeenCalledWith('/login')
  })

  describe('Hub mode (admin)', () => {
    it('shows platform group with hub dashboard and partners', () => {
      const wrapper = mountAdminHub()
      expect(wrapper.text()).toContain('nav.groups.platform')
      expect(wrapper.text()).toContain('nav.hubDashboard')
      expect(wrapper.text()).toContain('nav.partners')
    })

    it('shows admin group for admin users', () => {
      const wrapper = mountAdminHub()
      expect(wrapper.text()).toContain('nav.groups.admin')
      expect(wrapper.text()).toContain('nav.routers')
      expect(wrapper.text()).toContain('nav.variableSchemas')
      expect(wrapper.text()).toContain('nav.users')
    })

    it('shows operations and billing in hub mode for admin', () => {
      const wrapper = mountAdminHub()
      expect(wrapper.text()).toContain('nav.operations')
      expect(wrapper.text()).toContain('nav.billing')
    })

    it('does not show back-to-hub button in hub mode', () => {
      const wrapper = mountAdminHub()
      expect(wrapper.find('[data-back-to-hub]').exists()).toBe(false)
    })
  })

  describe('Scope mode (admin)', () => {
    it('shows scope navigation with scoped routes', () => {
      const wrapper = mountAdminScope()
      expect(wrapper.text()).toContain('nav.groups.main')
      expect(wrapper.text()).toContain('nav.dashboard')
      expect(wrapper.text()).toContain('nav.campaigns')

      const links = wrapper.findAll('a').map(a => a.attributes('href'))
      expect(links).toContain('/partners/42/dashboard')
      expect(links).toContain('/partners/42/campaigns')
    })

    it('shows back-to-hub button in scope mode for internal users', () => {
      const wrapper = mountAdminScope()
      expect(wrapper.find('[data-back-to-hub]').exists()).toBe(true)
      expect(wrapper.text()).toContain('nav.backToHub')
    })

    it('does not show admin group in scope mode', () => {
      const wrapper = mountAdminScope()
      expect(wrapper.text()).not.toContain('nav.groups.admin')
    })
  })

  describe('Partner-bound user (scope always)', () => {
    it('shows scope navigation for partner role', () => {
      const wrapper = mountSidebar() // partner role, always scope
      expect(wrapper.text()).toContain('nav.groups.main')
      expect(wrapper.text()).toContain('nav.dashboard')
      expect(wrapper.text()).toContain('nav.campaigns')
    })

    it('does not show back-to-hub for partner-bound user', () => {
      const wrapper = mountSidebar()
      expect(wrapper.find('[data-back-to-hub]').exists()).toBe(false)
    })

    it('does not show admin group for partner user', () => {
      const wrapper = mountSidebar()
      expect(wrapper.text()).not.toContain('nav.groups.admin')
      expect(wrapper.text()).not.toContain('nav.routers')
    })
  })

  describe('ADV user in hub mode', () => {
    it('shows operations for user with view operations permission', () => {
      const auth = useAuthStore()
      auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdvUser })
      mockRoute = { path: '/hub/dashboard', params: {} }

      const wrapper = mount(AppSidebar, { global: { stubs: sidebarStubs } })

      expect(wrapper.text()).toContain('nav.groups.platform')
      expect(wrapper.text()).toContain('nav.operations')
      expect(wrapper.text()).toContain('nav.billing')
    })

    it('hides admin group for ADV user', () => {
      const auth = useAuthStore()
      auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdvUser })
      mockRoute = { path: '/hub/dashboard', params: {} }

      const wrapper = mount(AppSidebar, { global: { stubs: sidebarStubs } })

      expect(wrapper.text()).not.toContain('nav.groups.admin')
    })
  })

  describe('Short URLs permission', () => {
    it('shows short-urls entry in hub mode for admin', () => {
      const wrapper = mountAdminHub()
      expect(wrapper.text()).toContain('nav.shortUrls')
    })

    it('hides short-urls entry for user without view short-urls permission', () => {
      const auth = useAuthStore()
      auth.setAuth({ ...fakeAuthResponse.data, user: {
        ...fakeAdvUser,
        permissions: fakeAdvUser.permissions.filter(p => p !== 'view short-urls'),
      }})
      mockRoute = { path: '/hub/dashboard', params: {} }
      const wrapper = mount(AppSidebar, { global: { stubs: sidebarStubs } })
      expect(wrapper.text()).not.toContain('nav.shortUrls')
    })
  })
})
