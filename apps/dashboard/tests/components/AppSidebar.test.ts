import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computed, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../helpers/auth-stubs'
import { NuxtLinkStub, mockUseI18n } from '../helpers/stubs'
import { fakeAdminUser, fakeAuthResponse } from '../helpers/fixtures'

const mockApi = {
  POST: vi.fn(),
  GET: vi.fn(),
}

stubAuthGlobals({ $api: mockApi })

vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()
vi.stubGlobal('useRoute', () => ({ path: '/' }))
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
  SidebarGroup: slotStub,
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
  })

  function mountSidebar() {
    const auth = useAuthStore()
    auth.setAuth(fakeAuthResponse.data)

    return mount(AppSidebar, {
      global: { stubs: sidebarStubs },
    })
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

  it('renders 2 navigation groups for the shipped scope', () => {
    const wrapper = mountSidebar()
    expect(wrapper.text()).toContain('nav.groups.main')
    expect(wrapper.text()).toContain('nav.groups.config')
    expect(wrapper.text()).not.toContain('nav.groups.admin')
    expect(wrapper.text()).not.toContain('nav.shops')
    expect(wrapper.text()).not.toContain('nav.landingPages')
    expect(wrapper.text()).not.toContain('nav.stats')
  })

  it('renders admin navigation group and links for admins', () => {
    const auth = useAuthStore()
    auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })

    const wrapper = mount(AppSidebar, { global: { stubs: sidebarStubs } })

    expect(wrapper.text()).toContain('nav.groups.admin')
    expect(wrapper.text()).toContain('nav.routers')
    expect(wrapper.text()).toContain('nav.variableSchemas')

    const links = wrapper.findAll('a').map(link => link.attributes('href'))
    expect(links).toContain('/admin/routers')
    expect(links).toContain('/admin/variable-schemas')
  })

  describe('partner badge', () => {
    function mountAdminSidebar() {
      const auth = useAuthStore()
      auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })
      return mount(AppSidebar, { global: { stubs: sidebarStubs } })
    }

    it('shows badge when admin + scoped', () => {
      const auth = useAuthStore()
      auth.setAuth({ ...fakeAuthResponse.data, user: fakeAdminUser })
      const partnerStore = usePartnerStore()
      partnerStore.setPartner(42, 'Test Partner')

      const wrapper = mount(AppSidebar, { global: { stubs: sidebarStubs } })
      const badge = wrapper.find('[data-badge]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('Test Partner')
    })

    it('hides badge when non-admin', () => {
      const wrapper = mountSidebar()
      expect(wrapper.find('[data-badge]').exists()).toBe(false)
    })

    it('hides badge when admin without selection', () => {
      const wrapper = mountAdminSidebar()
      expect(wrapper.find('[data-badge]').exists()).toBe(false)
    })
  })
})
