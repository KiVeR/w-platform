import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { computed, ref, watch, onMounted } from 'vue'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { mockUseI18n } from '../../helpers/stubs'

const mockPost = vi.fn()
const mockGet = vi.fn()

stubAuthGlobals({ $api: { POST: mockPost, GET: mockGet, PUT: vi.fn() } })
mockUseI18n()
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('watch', watch)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('definePageMeta', () => {})
const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('useRoute', () => ({ params: {} }))

const NewPartnerPage = (await import('@/pages/hub/partners/new.vue')).default

describe('hub/partners/new.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it('renders the partner form in create mode', () => {
    const wrapper = mount(NewPartnerPage)

    expect(wrapper.find('[data-new-partner-page]').exists()).toBe(true)
    expect(wrapper.find('[data-partner-form]').exists()).toBe(true)
  })

  it('navigates to partner detail on successful creation', async () => {
    mockPost.mockResolvedValue({
      data: { data: { id: 99, name: 'New Partner' } },
      error: undefined,
    })

    const wrapper = mount(NewPartnerPage)

    await wrapper.find('[data-field-name]').setValue('New Partner')
    await wrapper.find('[data-partner-form]').trigger('submit')
    await flushPromises()

    expect(mockNavigateTo).toHaveBeenCalledWith('/hub/partners/99')
  })

  it('navigates to partners list on cancel', async () => {
    const wrapper = mount(NewPartnerPage)

    await wrapper.find('[data-cancel-btn]').trigger('click')
    await flushPromises()

    expect(mockNavigateTo).toHaveBeenCalledWith('/hub/partners')
  })
})
