import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, onMounted, ref } from 'vue'
import { mockUseI18n } from '../../../helpers/stubs'

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('onMounted', onMounted)
mockUseI18n()

const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)

vi.mock('vue-sonner', () => ({ toast: { success: vi.fn() } }))

const mockRoute = { params: { id: '42' } }
vi.stubGlobal('useRoute', () => mockRoute)

const mockShortUrl = ref<object | null>(null)
const mockIsLoading = ref(false)
const mockHasError = ref(false)
const mockDeleteShortUrl = vi.fn()

vi.mock('@/composables/useShortUrlDetail', () => ({
  useShortUrlDetail: vi.fn(() => ({
    shortUrl: mockShortUrl,
    isLoading: mockIsLoading,
    hasError: mockHasError,
    fetchShortUrl: vi.fn(),
    updateShortUrl: vi.fn(),
    deleteShortUrl: mockDeleteShortUrl,
  })),
}))

const mockCan = vi.fn(() => false)
vi.mock('@/composables/usePermission', () => ({
  usePermission: vi.fn(() => ({ can: mockCan })),
}))

const ShortUrlInfoCardStub = defineComponent({
  name: 'ShortUrlInfoCard',
  template: '<div data-stub="short-url-info-card" />',
  props: ['shortUrl'],
})

const ShortUrlStatsCardStub = defineComponent({
  name: 'ShortUrlStatsCard',
  template: '<div data-stub="short-url-stats-card" />',
  props: ['shortUrl'],
})

const PageSkeletonStub = defineComponent({
  name: 'PageSkeleton',
  template: '<div data-stub="page-skeleton" />',
  props: ['variant'],
})

const NuxtLinkStub = defineComponent({
  name: 'NuxtLink',
  template: '<a data-stub="nuxt-link"><slot /></a>',
  props: ['to'],
})

// Import after stubs
const DetailPage = (await import('@/pages/short-urls/[id]/index.vue')).default

// Get the mocked toast
const { toast } = await import('vue-sonner')

function mountPage() {
  return mount(DetailPage, {
    global: {
      stubs: {
        ShortUrlInfoCard: ShortUrlInfoCardStub,
        ShortUrlStatsCard: ShortUrlStatsCardStub,
        PageSkeleton: PageSkeletonStub,
        NuxtLink: NuxtLinkStub,
        AlertDialog: { template: '<div data-stub="alert-dialog"><slot /></div>' },
        AlertDialogTrigger: { template: '<div data-stub="alert-dialog-trigger"><slot /></div>', props: ['asChild'] },
        AlertDialogContent: { template: '<div data-stub="alert-dialog-content"><slot /></div>' },
        AlertDialogHeader: { template: '<div><slot /></div>' },
        AlertDialogFooter: { template: '<div><slot /></div>' },
        AlertDialogTitle: { template: '<div data-stub="alert-dialog-title"><slot /></div>' },
        AlertDialogDescription: { template: '<div data-stub="alert-dialog-description"><slot /></div>' },
        AlertDialogCancel: { template: '<button data-stub="alert-dialog-cancel"><slot /></button>' },
        AlertDialogAction: {
          template: '<button data-stub="alert-dialog-action" @click="$emit(\'click\')"><slot /></button>',
          emits: ['click'],
        },
        Button: { template: '<button><slot /></button>' },
        Pencil: { template: '<span />' },
        Trash2: { template: '<span />' },
      },
    },
  })
}

describe('short-urls/[id]/index page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockShortUrl.value = null
    mockIsLoading.value = false
    mockHasError.value = false
    mockCan.mockReturnValue(false)
    mockDeleteShortUrl.mockResolvedValue(false)
  })

  it('displays the slug as page title when shortUrl is loaded', async () => {
    mockShortUrl.value = { id: 42, slug: 'my-slug' }
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('my-slug')
  })

  it('displays the detail title key when shortUrl is not loaded', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('shortUrls.detail.title')
  })

  it('displays PageSkeleton while loading', async () => {
    mockIsLoading.value = true
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-stub="page-skeleton"]').exists()).toBe(true)
    expect(wrapper.find('[data-stub="short-url-info-card"]').exists()).toBe(false)
    expect(wrapper.find('[data-stub="short-url-stats-card"]').exists()).toBe(false)
  })

  it('displays error message when hasError is true', async () => {
    mockHasError.value = true
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-stub="page-skeleton"]').exists()).toBe(false)
    expect(wrapper.find('[data-stub="short-url-info-card"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('common.retry')
  })

  it('renders both InfoCard and StatsCard when data is loaded', async () => {
    mockShortUrl.value = { id: 42, slug: 'my-slug' }
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-stub="short-url-info-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-stub="short-url-stats-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-stub="page-skeleton"]').exists()).toBe(false)
  })

  it('shows edit and delete buttons when user has manage short-urls permission', async () => {
    mockShortUrl.value = { id: 42, slug: 'my-slug' }
    mockCan.mockReturnValue(true)
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-stub="nuxt-link"]').exists()).toBe(true)
    expect(wrapper.find('[data-stub="alert-dialog"]').exists()).toBe(true)
  })

  it('hides edit and delete buttons without manage short-urls permission', async () => {
    mockShortUrl.value = { id: 42, slug: 'my-slug' }
    mockCan.mockReturnValue(false)
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-stub="nuxt-link"]').exists()).toBe(false)
    expect(wrapper.find('[data-stub="alert-dialog"]').exists()).toBe(false)
  })

  it('handleDelete calls deleteShortUrl and navigates to /short-urls on success', async () => {
    mockShortUrl.value = { id: 42, slug: 'my-slug' }
    mockCan.mockReturnValue(true)
    mockDeleteShortUrl.mockResolvedValue(true)
    const wrapper = mountPage()
    await flushPromises()

    const action = wrapper.find('[data-stub="alert-dialog-action"]')
    await action.trigger('click')
    await flushPromises()

    expect(mockDeleteShortUrl).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('shortUrls.form.deleteSuccess')
    expect(mockNavigateTo).toHaveBeenCalledWith('/short-urls')
  })

  it('handleDelete does not navigate when deleteShortUrl returns false', async () => {
    mockShortUrl.value = { id: 42, slug: 'my-slug' }
    mockCan.mockReturnValue(true)
    mockDeleteShortUrl.mockResolvedValue(false)
    const wrapper = mountPage()
    await flushPromises()

    const action = wrapper.find('[data-stub="alert-dialog-action"]')
    await action.trigger('click')
    await flushPromises()

    expect(mockDeleteShortUrl).toHaveBeenCalled()
    expect(mockNavigateTo).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })
})
