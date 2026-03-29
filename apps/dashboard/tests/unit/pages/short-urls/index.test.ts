import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, onMounted, defineComponent } from 'vue'
import { mockUseI18n } from '../../../helpers/stubs'

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('onMounted', onMounted)
mockUseI18n()

const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)

// Module-level state for useShortUrls mock
// These are plain objects — refs are created in beforeEach below
let _shortUrls: ReturnType<typeof ref<any[]>>
let _pagination: ReturnType<typeof ref<{ page: number; lastPage: number; total: number }>>
let _isLoading: ReturnType<typeof ref<boolean>>
let _hasError: ReturnType<typeof ref<boolean>>
let _filters: ReturnType<typeof ref<{ search: string; isEnabled: string }>>
let _sort: ReturnType<typeof ref<string>>
let _fetchShortUrls: ReturnType<typeof vi.fn>
let _deleteShortUrl: ReturnType<typeof vi.fn>
let _setPage: ReturnType<typeof vi.fn>
let _setSort: ReturnType<typeof vi.fn>
let _setFilters: ReturnType<typeof vi.fn>

// Initialize refs at module level (after imports are available)
_shortUrls = ref<any[]>([])
_pagination = ref({ page: 1, lastPage: 1, total: 0 })
_isLoading = ref(false)
_hasError = ref(false)
_filters = ref({ search: '', isEnabled: 'all' })
_sort = ref('-created_at')
_fetchShortUrls = vi.fn(async () => {})
_deleteShortUrl = vi.fn(async () => true)
_setPage = vi.fn(async () => {})
_setSort = vi.fn(async () => {})
_setFilters = vi.fn()

vi.mock('@/composables/useShortUrls', () => ({
  useShortUrls: () => ({
    shortUrls: _shortUrls,
    pagination: _pagination,
    isLoading: _isLoading,
    hasError: _hasError,
    filters: _filters,
    sort: _sort,
    fetchShortUrls: _fetchShortUrls,
    deleteShortUrl: _deleteShortUrl,
    setPage: _setPage,
    setSort: _setSort,
    setFilters: _setFilters,
  }),
}))

// usePermission mock
let _canManage = true
const _canMock = vi.fn((permission: string) => {
  if (permission === 'manage short-urls') return _canManage
  return false
})

vi.mock('@/composables/usePermission', () => ({
  usePermission: () => ({
    can: _canMock,
    hasRole: vi.fn(() => false),
    hasAnyRole: vi.fn(() => false),
  }),
}))

const ShortUrlsIndexPage = (await import('@/pages/short-urls/index.vue')).default

const ShortUrlFiltersStub = defineComponent({
  name: 'ShortUrlFilters',
  template: '<div data-stub="filters" />',
  props: ['filters'],
  emits: ['update:filters'],
})

const ShortUrlDataTableStub = defineComponent({
  name: 'ShortUrlDataTable',
  template: '<div data-stub="table" />',
  props: ['data', 'isLoading', 'hasError', 'sort', 'pagination'],
  emits: ['sort', 'page', 'delete', 'view', 'edit', 'retry'],
})

const NuxtLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

function mountPage() {
  return mount(ShortUrlsIndexPage, {
    global: {
      stubs: {
        NuxtLink: NuxtLinkStub,
        Button: { template: '<button v-bind="$attrs"><slot /></button>' },
        ShortUrlFilters: ShortUrlFiltersStub,
        ShortUrlDataTable: ShortUrlDataTableStub,
      },
    },
  })
}

describe('short-urls/index page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _shortUrls.value = []
    _pagination.value = { page: 1, lastPage: 1, total: 0 }
    _isLoading.value = false
    _hasError.value = false
    _filters.value = { search: '', isEnabled: 'all' }
    _sort.value = '-created_at'
    _canManage = true
    _canMock.mockImplementation((permission: string) => {
      if (permission === 'manage short-urls') return _canManage
      return false
    })
    _fetchShortUrls.mockResolvedValue(undefined)
    _deleteShortUrl.mockResolvedValue(true)
  })

  it('calls fetchShortUrls on mount', async () => {
    mountPage()
    await flushPromises()
    expect(_fetchShortUrls).toHaveBeenCalledOnce()
  })

  it('renders the page title and description', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('shortUrls.title')
    expect(wrapper.text()).toContain('shortUrls.description')
  })

  it('shows the create button when user has manage short-urls permission', async () => {
    _canManage = true
    const wrapper = mountPage()
    await flushPromises()
    const link = wrapper.find('a[href="/short-urls/new"]')
    expect(link.exists()).toBe(true)
  })

  it('hides the create button when user lacks manage short-urls permission', async () => {
    _canManage = false
    _canMock.mockImplementation(() => false)
    const wrapper = mountPage()
    await flushPromises()
    const link = wrapper.find('a[href="/short-urls/new"]')
    expect(link.exists()).toBe(false)
  })

  it('handleDelete calls deleteShortUrl and refetches on success', async () => {
    const wrapper = mountPage()
    await flushPromises()
    _fetchShortUrls.mockClear()

    const table = wrapper.findComponent(ShortUrlDataTableStub)
    table.vm.$emit('delete', 7)
    await flushPromises()

    expect(_deleteShortUrl).toHaveBeenCalledWith(7)
    expect(_fetchShortUrls).toHaveBeenCalledOnce()
  })

  it('handleDelete does not refetch when deleteShortUrl returns false', async () => {
    _deleteShortUrl.mockResolvedValue(false)
    const wrapper = mountPage()
    await flushPromises()
    _fetchShortUrls.mockClear()

    const table = wrapper.findComponent(ShortUrlDataTableStub)
    table.vm.$emit('delete', 7)
    await flushPromises()

    expect(_deleteShortUrl).toHaveBeenCalledWith(7)
    expect(_fetchShortUrls).not.toHaveBeenCalled()
  })

  it('handleView navigates to /short-urls/{id}', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const table = wrapper.findComponent(ShortUrlDataTableStub)
    table.vm.$emit('view', 42)
    await flushPromises()

    expect(mockNavigateTo).toHaveBeenCalledWith('/short-urls/42')
  })

  it('handleEdit navigates to /short-urls/{id}/edit', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const table = wrapper.findComponent(ShortUrlDataTableStub)
    table.vm.$emit('edit', 42)
    await flushPromises()

    expect(mockNavigateTo).toHaveBeenCalledWith('/short-urls/42/edit')
  })

  it('handleSort calls setSort', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const table = wrapper.findComponent(ShortUrlDataTableStub)
    table.vm.$emit('sort', 'slug')
    await flushPromises()

    expect(_setSort).toHaveBeenCalledWith('slug')
  })

  it('handlePage calls setPage', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const table = wrapper.findComponent(ShortUrlDataTableStub)
    table.vm.$emit('page', 3)
    await flushPromises()

    expect(_setPage).toHaveBeenCalledWith(3)
  })

  it('handleFilterUpdate calls setFilters and refetches', async () => {
    const wrapper = mountPage()
    await flushPromises()
    _fetchShortUrls.mockClear()

    const filtersComp = wrapper.findComponent(ShortUrlFiltersStub)
    filtersComp.vm.$emit('update:filters', { search: 'promo' })
    await flushPromises()

    expect(_setFilters).toHaveBeenCalledWith({ search: 'promo' })
    expect(_fetchShortUrls).toHaveBeenCalledOnce()
  })

  it('retry event triggers fetchShortUrls', async () => {
    const wrapper = mountPage()
    await flushPromises()
    _fetchShortUrls.mockClear()

    const table = wrapper.findComponent(ShortUrlDataTableStub)
    table.vm.$emit('retry')
    await flushPromises()

    expect(_fetchShortUrls).toHaveBeenCalledOnce()
  })

  it('renders ShortUrlFilters component', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-stub="filters"]').exists()).toBe(true)
  })

  it('renders ShortUrlDataTable component', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-stub="table"]').exists()).toBe(true)
  })
})
