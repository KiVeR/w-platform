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

vi.mock('@/composables/useShortUrlDetail', () => ({
  useShortUrlDetail: vi.fn(() => ({
    shortUrl: mockShortUrl,
    isLoading: mockIsLoading,
    hasError: mockHasError,
    fetchShortUrl: vi.fn(),
    updateShortUrl: vi.fn(),
    deleteShortUrl: vi.fn(),
  })),
}))

const ShortUrlFormStub = defineComponent({
  name: 'ShortUrlForm',
  template: '<div data-stub="short-url-form" />',
  props: ['shortUrl'],
  emits: ['saved', 'cancel'],
})

const PageSkeletonStub = defineComponent({
  name: 'PageSkeleton',
  template: '<div data-stub="page-skeleton" />',
  props: ['variant'],
})

// Import after stubs
const EditPage = (await import('@/pages/short-urls/[id]/edit.vue')).default

// Get the mocked toast
const { toast } = await import('vue-sonner')

function mountPage() {
  return mount(EditPage, {
    global: {
      stubs: {
        ShortUrlForm: ShortUrlFormStub,
        PageSkeleton: PageSkeletonStub,
      },
    },
  })
}

describe('short-urls/[id]/edit page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockShortUrl.value = null
    mockIsLoading.value = false
    mockHasError.value = false
  })

  it('renders the edit title', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('shortUrls.form.editTitle')
  })

  it('displays skeleton while loading', async () => {
    mockIsLoading.value = true
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-stub="page-skeleton"]').exists()).toBe(true)
    expect(wrapper.find('[data-stub="short-url-form"]').exists()).toBe(false)
  })

  it('renders ShortUrlForm with data when loaded', async () => {
    mockShortUrl.value = { id: 42, slug: 'test-slug' }
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-stub="short-url-form"]').exists()).toBe(true)
    expect(wrapper.find('[data-stub="page-skeleton"]').exists()).toBe(false)
  })

  it('onSaved shows a toast and navigates to /short-urls/{id}', async () => {
    mockShortUrl.value = { id: 42, slug: 'test-slug' }
    const wrapper = mountPage()
    await flushPromises()

    const form = wrapper.findComponent(ShortUrlFormStub)
    form.vm.$emit('saved', 99)
    await flushPromises()

    expect(toast.success).toHaveBeenCalledWith('shortUrls.form.saveSuccess')
    expect(mockNavigateTo).toHaveBeenCalledWith('/short-urls/99')
  })

  it('onCancel navigates to /short-urls/{id}', async () => {
    mockShortUrl.value = { id: 42, slug: 'test-slug' }
    const wrapper = mountPage()
    await flushPromises()

    const form = wrapper.findComponent(ShortUrlFormStub)
    form.vm.$emit('cancel')
    await flushPromises()

    expect(mockNavigateTo).toHaveBeenCalledWith('/short-urls/42')
  })

  it('displays error state when hasError is true', async () => {
    mockHasError.value = true
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-stub="short-url-form"]').exists()).toBe(false)
    expect(wrapper.find('[data-stub="page-skeleton"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('common.retry')
  })
})
