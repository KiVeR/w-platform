import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeAdminUser, fakeAdvUser } from '../../helpers/fixtures'
import { NuxtLinkStub, mockUseI18n } from '../../helpers/stubs'
import { useAuthStore } from '@/stores/auth'
import type { PartnerRow, PartnerPagination, PartnerFilters } from '@/types/partner'

stubAuthGlobals()
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('watch', watch)
vi.stubGlobal('definePageMeta', () => {})
const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('useRoute', () => ({ params: {}, path: '/hub/partners' }))
mockUseI18n()

const mockPartners = ref<PartnerRow[]>([
  {
    id: 1, name: 'Partner Alpha', code: 'PA', activity_type: 'boulangerie',
    email: 'a@test.fr', euro_credits: 1500, is_active: true, users_count: 3,
    shops_count: 2, created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2, name: 'Partner Beta', code: 'PB', activity_type: null,
    email: null, euro_credits: 100, is_active: false, users_count: 1,
    shops_count: 0, created_at: '2026-02-01T00:00:00Z',
  },
])
const mockPagination = ref<PartnerPagination>({ page: 1, lastPage: 1, total: 2 })
const mockIsLoading = ref(false)
const mockHasError = ref(false)
const mockFilters = ref<PartnerFilters>({ name: '', is_active: null })
const mockSort = ref('-created_at')
const mockFetchPartners = vi.fn(async () => {})
const mockSetPage = vi.fn(async () => {})
const mockSetSort = vi.fn(async () => {})
const mockSetFilters = vi.fn()

vi.stubGlobal('usePartners', () => ({
  partners: mockPartners,
  pagination: mockPagination,
  isLoading: mockIsLoading,
  hasError: mockHasError,
  filters: mockFilters,
  sort: mockSort,
  perPage: ref(15),
  fetchPartners: mockFetchPartners,
  deletePartner: vi.fn(),
  setPage: mockSetPage,
  setSort: mockSetSort,
  setFilters: mockSetFilters,
}))

const mockEnterPartner = vi.fn()
vi.stubGlobal('useScopedNavigation', () => ({
  enterPartner: mockEnterPartner,
  exitToHub: vi.fn(),
  scopedRoute: vi.fn(),
  hubRoute: vi.fn(),
}))

const HubPartnersIndexPage = (await import('@/pages/hub/partners/index.vue')).default

const PartnerDataTableStub = defineComponent({
  name: 'PartnerDataTable',
  template: '<div data-partner-table />',
  emits: ['sort', 'page', 'enter', 'edit', 'retry'],
})

describe('hub/partners/index page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())

    const auth = useAuthStore()
    auth.user = { ...fakeAdminUser }

    mockPartners.value = [
      {
        id: 1, name: 'Partner Alpha', code: 'PA', activity_type: 'boulangerie',
        email: 'a@test.fr', euro_credits: 1500, is_active: true, users_count: 3,
        shops_count: 2, created_at: '2026-01-01T00:00:00Z',
      },
    ]
    mockIsLoading.value = false
    mockHasError.value = false
  })

  function mountPage() {
    return mount(HubPartnersIndexPage, {
      global: {
        stubs: {
          NuxtLink: NuxtLinkStub,
          Button: { template: '<button v-bind="$attrs"><slot /></button>' },
          Input: { template: '<input v-bind="$attrs" />', props: ['modelValue', 'placeholder'] },
          Select: { template: '<div><slot /></div>' },
          SelectTrigger: { template: '<div v-bind="$attrs"><slot /></div>' },
          SelectContent: { template: '<div><slot /></div>' },
          SelectItem: { template: '<div><slot /></div>', props: ['value'] },
          SelectValue: { template: '<span />', props: ['placeholder'] },
          PartnerDataTable: PartnerDataTableStub,
        },
      },
    })
  }

  it('calls fetchPartners on mount', async () => {
    mountPage()
    await flushPromises()

    expect(mockFetchPartners).toHaveBeenCalledTimes(1)
  })

  it('renders page title', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-hub-partners-page]').exists()).toBe(true)
    expect(wrapper.text()).toContain('hub.partners.title')
  })

  it('shows new partner button for admin', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-new-partner-btn]').exists()).toBe(true)
  })

  it('hides new partner button for non-admin (adv)', async () => {
    const auth = useAuthStore()
    auth.user = { ...fakeAdvUser }

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-new-partner-btn]').exists()).toBe(false)
  })

  it('renders search input', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-search-input]').exists()).toBe(true)
  })

  it('renders status filter', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-status-filter]').exists()).toBe(true)
  })

  it('renders PartnerDataTable component', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-partner-table]').exists()).toBe(true)
  })

  it('handles enter event by calling enterPartner', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const table = wrapper.findComponent(PartnerDataTableStub)
    table.vm.$emit('enter', { id: 1, name: 'Partner Alpha' })
    await flushPromises()

    expect(mockEnterPartner).toHaveBeenCalledWith(1, 'Partner Alpha')
  })

  it('handles edit event by navigating to partner edit page', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const table = wrapper.findComponent(PartnerDataTableStub)
    table.vm.$emit('edit', 42)
    await flushPromises()

    expect(mockNavigateTo).toHaveBeenCalledWith('/hub/partners/42')
  })

  it('handles sort event', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const table = wrapper.findComponent(PartnerDataTableStub)
    table.vm.$emit('sort', 'name')
    await flushPromises()

    expect(mockSetSort).toHaveBeenCalledWith('name')
  })

  it('handles page event', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const table = wrapper.findComponent(PartnerDataTableStub)
    table.vm.$emit('page', 2)
    await flushPromises()

    expect(mockSetPage).toHaveBeenCalledWith(2)
  })

  it('handles retry event by re-fetching', async () => {
    const wrapper = mountPage()
    await flushPromises()

    mockFetchPartners.mockClear()
    const table = wrapper.findComponent(PartnerDataTableStub)
    table.vm.$emit('retry')
    await flushPromises()

    expect(mockFetchPartners).toHaveBeenCalledTimes(1)
  })
})
