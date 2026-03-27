import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { mockUseI18n } from '../../helpers/stubs'
import { stubAuthGlobals, localStorageMock } from '../../helpers/auth-stubs'
import { fakeAdminUser, fakeAuthResponse, fakeUser } from '../../helpers/fixtures'
import { createPinia, setActivePinia } from 'pinia'

const mockGet = vi.fn()
const mockEnterPartner = vi.fn()
const mockNavigateTo = vi.fn()

stubAuthGlobals({ $api: { GET: mockGet, POST: vi.fn(), PUT: vi.fn(), DELETE: vi.fn() } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

let mockRoute = { path: '/hub/dashboard', params: {} as Record<string, string> }
vi.stubGlobal('useRoute', () => mockRoute)
vi.stubGlobal('navigateTo', mockNavigateTo)

vi.mock('@vueuse/core', () => ({
  useMagicKeys: () => ({
    'Meta+k': ref(false),
    'Ctrl+k': ref(false),
  }),
  useDebounceFn: (fn: (...args: unknown[]) => unknown) => fn,
}))

vi.stubGlobal('useScopedNavigation', () => ({
  enterPartner: mockEnterPartner,
  scopedRoute: (p: string) => p,
  hubRoute: (p: string) => p,
  exitToHub: vi.fn(),
}))

vi.stubGlobal('useNavigationMode', () => ({
  mode: computed(() => mockRoute.path.startsWith('/partners/') ? 'scope' : 'hub'),
  isScope: computed(() => mockRoute.path.startsWith('/partners/')),
  scopedPartnerId: computed(() => {
    const match = mockRoute.path.match(/^\/partners\/(\d+)/)
    return match ? Number(match[1]) : null
  }),
}))

vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
})

const { useAuthStore } = await import('@/stores/auth')

const CommandPalette = (await import('@/components/shared/CommandPalette.vue')).default

const slotStub = { template: '<div><slot /></div>' }
const voidStub = { template: '<div />' }

/**
 * Stubs always render content (ignoring open state) so we can test
 * the internal template logic (pages, actions, partners).
 */
const stubs: Record<string, unknown> = {
  CommandDialog: {
    template: '<div data-command-dialog><slot /></div>',
    props: ['open'],
  },
  CommandInput: {
    template: '<input data-command-input :placeholder="placeholder" />',
    props: ['modelValue', 'placeholder'],
  },
  CommandList: slotStub,
  CommandGroup: {
    template: '<div data-command-group v-bind="$attrs"><slot /></div>',
    props: ['heading'],
    inheritAttrs: false,
  },
  CommandItem: {
    template: '<button data-command-item @click="$emit(\'select\')"><slot /></button>',
    props: ['value'],
    emits: ['select'],
  },
  CommandEmpty: slotStub,
  CommandSeparator: voidStub,
}

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    mockRoute = { path: '/hub/dashboard', params: {} }
  })

  function mountPalette(user = fakeAdminUser) {
    const auth = useAuthStore()
    auth.setAuth({ ...fakeAuthResponse.data, user })
    return mount(CommandPalette, { global: { stubs } })
  }

  it('renders without errors', () => {
    const wrapper = mountPalette()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-command-dialog]').exists()).toBe(true)
  })

  it('shows pages group with data-pages-group attribute', () => {
    const wrapper = mountPalette()
    expect(wrapper.find('[data-pages-group]').exists()).toBe(true)
  })

  it('shows hub pages when in hub mode', () => {
    mockRoute = { path: '/hub/dashboard', params: {} }
    const wrapper = mountPalette()
    expect(wrapper.text()).toContain('nav.dashboard')
    expect(wrapper.text()).toContain('nav.partners')
  })

  it('shows scope pages when in scope mode', () => {
    mockRoute = { path: '/partners/42/dashboard', params: { id: '42' } }
    const wrapper = mountPalette()
    expect(wrapper.text()).toContain('nav.dashboard')
    expect(wrapper.text()).toContain('nav.campaigns')
    expect(wrapper.text()).toContain('nav.settings')
  })

  it('shows actions group for admin with new partner action', () => {
    const wrapper = mountPalette(fakeAdminUser)
    expect(wrapper.find('[data-actions-group]').exists()).toBe(true)
    expect(wrapper.text()).toContain('commandPalette.newPartner')
  })

  it('shows new campaign action in scope mode', () => {
    mockRoute = { path: '/partners/42/dashboard', params: { id: '42' } }
    const wrapper = mountPalette()
    expect(wrapper.text()).toContain('commandPalette.newCampaign')
  })

  it('hides new partner action for non-admin user', () => {
    const wrapper = mountPalette(fakeUser)
    expect(wrapper.text()).not.toContain('commandPalette.newPartner')
  })

  it('navigateToPage calls navigateTo when a page item is selected', async () => {
    const wrapper = mountPalette()
    const items = wrapper.findAll('[data-command-item]')
    expect(items.length).toBeGreaterThan(0)

    // Click the first page item
    await items[0].trigger('click')
    await flushPromises()

    expect(mockNavigateTo).toHaveBeenCalled()
  })
})
