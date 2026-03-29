import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, computed, onMounted } from 'vue'
import { mockUseI18n } from '../../helpers/stubs'

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('computed', computed)
mockUseI18n()

// Router stub
const routerPushMock = vi.fn()
vi.stubGlobal('useRouter', () => ({ push: routerPushMock }))
vi.stubGlobal('useScopedNavigation', () => ({ scopedRoute: (p: string) => p, hubRoute: (p: string) => p, enterPartner: vi.fn(), exitToHub: vi.fn() }))

// useDemandes stub state
const demandes = ref<any[]>([])
const pagination = ref({ page: 1, lastPage: 1, total: 0 })
const isLoading = ref(false)
const hasError = ref(false)
const filters = ref({})
const sort = ref('-created_at')
const fetchDemandes = vi.fn()
const setPage = vi.fn()
const setSort = vi.fn()
const setFilters = vi.fn()

vi.stubGlobal('useDemandes', () => ({
  demandes,
  pagination,
  isLoading,
  hasError,
  filters,
  sort,
  fetchDemandes,
  setPage,
  setSort,
  setFilters,
}))

// usePermission stub — mock the module so the explicit import is overridden
const canManageDemandes = ref(true)
const canMock = vi.fn((permission: string) => {
  if (permission === 'manage demandes') return canManageDemandes.value
  return false
})

vi.mock('@/composables/usePermission', () => ({
  usePermission: () => ({
    can: canMock,
    hasRole: vi.fn(() => false),
    hasAnyRole: vi.fn(() => false),
  }),
}))

const DemandesIndex = (await import('@/pages/demandes/index.vue')).default

const DemandesDataTableStub = {
  name: 'DemandesDataTable',
  template: '<div data-stub="table" />',
  props: ['demandes', 'isLoading', 'sort'],
  emits: ['select', 'sort'],
}

const NuxtLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

const ButtonStub = {
  template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
  emits: ['click'],
}

function mountPage() {
  return mount(DemandesIndex, {
    global: {
      stubs: {
        NuxtLink: NuxtLinkStub,
        Button: ButtonStub,
        DemandesDataTable: DemandesDataTableStub,
      },
    },
  })
}

describe('demandes/index page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    demandes.value = []
    pagination.value = { page: 1, lastPage: 1, total: 0 }
    isLoading.value = false
    hasError.value = false
    filters.value = {}
    sort.value = '-created_at'
    canManageDemandes.value = true
    canMock.mockImplementation((permission: string) => {
      if (permission === 'manage demandes') return canManageDemandes.value
      return false
    })
  })

  it('renders page title', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('demandes.list.title')
  })

  it('shows new demande button when user can manage', () => {
    canManageDemandes.value = true
    const wrapper = mountPage()
    const link = wrapper.find('a[href="/demandes/new"]')
    expect(link.exists()).toBe(true)
  })

  it('hides new demande button when user cannot manage', () => {
    canManageDemandes.value = false
    canMock.mockImplementation((permission: string) => {
      if (permission === 'manage demandes') return false
      return false
    })
    const wrapper = mountPage()
    const link = wrapper.find('a[href="/demandes/new"]')
    expect(link.exists()).toBe(false)
  })

  it('calls fetchDemandes on mount', () => {
    mountPage()
    expect(fetchDemandes).toHaveBeenCalledOnce()
  })

  it('renders DemandesDataTable', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-stub="table"]').exists()).toBe(true)
  })

  it('navigates to detail on select', async () => {
    demandes.value = [{
      id: 42,
      ref_demande: 'REF-42',
      partner: null,
      operations_count: 0,
      operations_completed_count: 0,
      operations_blocked_count: 0,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      partner_id: 1,
      is_exoneration: false,
      ref_client: null,
      information: null,
      pays_id: null,
      commercial_id: null,
      sdr_id: null,
    }]
    const wrapper = mountPage()
    const table = wrapper.findComponent(DemandesDataTableStub)
    table.vm.$emit('select', { id: 42 })
    await flushPromises()
    expect(routerPushMock).toHaveBeenCalledWith('/demandes/42')
  })

  it('navigates to new on button click', () => {
    canManageDemandes.value = true
    const wrapper = mountPage()
    const link = wrapper.find('a[href="/demandes/new"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/demandes/new')
  })

  it('shows loading state passed to DataTable', () => {
    isLoading.value = true
    const wrapper = mountPage()
    const table = wrapper.findComponent(DemandesDataTableStub)
    expect(table.props('isLoading')).toBe(true)
  })

  it('shows error state with retry button', () => {
    hasError.value = true
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="error-state"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="error-state"]').text()).toContain('common.retry')
  })

  it('applies search filter on enter key', async () => {
    const wrapper = mountPage()
    const searchInput = wrapper.find('[data-testid="search-ref"]')
    await searchInput.setValue('REF-001')
    await searchInput.trigger('keyup.enter')
    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ ref_demande: 'REF-001' }))
    expect(fetchDemandes).toHaveBeenCalled()
  })

  it('shows pagination when lastPage > 1', () => {
    pagination.value = { page: 1, lastPage: 3, total: 30 }
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="prev-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="next-page"]').exists()).toBe(true)
  })

  it('calls setPage on page change', async () => {
    pagination.value = { page: 1, lastPage: 3, total: 30 }
    const wrapper = mountPage()
    const nextBtn = wrapper.find('[data-testid="next-page"]')
    await nextBtn.trigger('click')
    expect(setPage).toHaveBeenCalledWith(2)
  })
})
