import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { mockUseI18n } from '../../../helpers/stubs'

vi.stubGlobal('definePageMeta', vi.fn())
mockUseI18n()

const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)

const mockToast = { success: vi.fn() }
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn() } }))

const ShortUrlFormStub = defineComponent({
  name: 'ShortUrlForm',
  template: '<div data-stub="short-url-form" />',
  props: ['shortUrl'],
  emits: ['saved', 'cancel'],
})

// Import after stubs
const NewPage = (await import('@/pages/short-urls/new.vue')).default

// Get the mocked toast
const { toast } = await import('vue-sonner')

function mountPage() {
  return mount(NewPage, {
    global: {
      stubs: {
        ShortUrlForm: ShortUrlFormStub,
      },
    },
  })
}

describe('short-urls/new page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the creation title', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('shortUrls.form.createTitle')
  })

  it('renders the ShortUrlForm component', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-stub="short-url-form"]').exists()).toBe(true)
  })

  it('onSaved shows a toast and navigates to /short-urls/{id}', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const form = wrapper.findComponent(ShortUrlFormStub)
    form.vm.$emit('saved', 42)
    await flushPromises()

    expect(toast.success).toHaveBeenCalledWith('shortUrls.form.saveSuccess')
    expect(mockNavigateTo).toHaveBeenCalledWith('/short-urls/42')
  })

  it('onCancel navigates to /short-urls', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const form = wrapper.findComponent(ShortUrlFormStub)
    form.vm.$emit('cancel')
    await flushPromises()

    expect(mockNavigateTo).toHaveBeenCalledWith('/short-urls')
  })
})
