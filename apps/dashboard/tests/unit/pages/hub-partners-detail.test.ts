import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { computed, ref, watch, onMounted } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeAdminUser } from '../../helpers/fixtures'
import { mockUseI18n } from '../../helpers/stubs'
import { useAuthStore } from '@/stores/auth'

const mockGet = vi.fn()
const mockPut = vi.fn()
const mockPost = vi.fn()

stubAuthGlobals({ $api: { GET: mockGet, PUT: mockPut, POST: mockPost } })
mockUseI18n()
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('watch', watch)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('definePageMeta', () => {})
const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('useRoute', () => ({ params: { id: '42' } }))

vi.stubGlobal('useUsers', () => ({
  users: ref([]),
  pagination: ref({ page: 1, lastPage: 1, total: 0 }),
  isLoading: ref(false),
  hasError: ref(false),
  filters: ref({}),
  sort: ref('-created_at'),
  perPage: ref(15),
  fetchUsers: vi.fn(async () => {}),
  createUser: vi.fn(async () => null),
  updateUser: vi.fn(async () => null),
  deleteUser: vi.fn(async () => true),
  setPage: vi.fn(async () => {}),
  setSort: vi.fn(async () => {}),
  setFilters: vi.fn(),
}))

const PartnerDetailPage = (await import('@/pages/hub/partners/[id].vue')).default

function mockPartnerApiCalls() {
  // partner detail
  mockGet.mockImplementation((url: string) => {
    if (url.includes('/features')) {
      return Promise.resolve({
        data: { data: [{ key: 'shops', is_enabled: true }] },
        error: undefined,
      })
    }
    if (url.includes('/balance')) {
      return Promise.resolve({
        data: { data: { partner_id: 42, euro_credits: '1500.50' } },
        error: undefined,
      })
    }
    if (url.includes('/transactions')) {
      return Promise.resolve({
        data: { data: [] },
        error: undefined,
      })
    }
    // partner detail
    return Promise.resolve({
      data: {
        data: {
          id: 42,
          name: 'Test Partner',
          code: 'TP-001',
          activity_type: 'boulangerie',
          email: 'test@test.fr',
          phone: '0600000000',
          address: '1 rue de la Paix',
          city: 'Paris',
          zip_code: '75001',
          euro_credits: '1500.50',
          is_active: true,
          router_id: null,
          billing_mode: 'prepaid',
          adv_id: null,
          created_at: '2026-01-01T00:00:00Z',
          users_count: 3,
          shops_count: 2,
        },
      },
      error: undefined,
    })
  })
}

describe('hub/partners/[id].vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())

    const auth = useAuthStore()
    auth.user = fakeAdminUser as never
  })

  it('renders the partner detail page with tabs', async () => {
    mockPartnerApiCalls()

    const wrapper = mount(PartnerDetailPage)
    await flushPromises()

    expect(wrapper.find('[data-partner-detail-page]').exists()).toBe(true)
    expect(wrapper.find('[data-tabs-list]').exists()).toBe(true)
    expect(wrapper.find('[data-tab-info]').exists()).toBe(true)
    expect(wrapper.find('[data-tab-credits]').exists()).toBe(true)
    expect(wrapper.find('[data-tab-features]').exists()).toBe(true)
    expect(wrapper.find('[data-tab-users]').exists()).toBe(true)
  })

  it('shows partner name in header after loading', async () => {
    mockPartnerApiCalls()

    const wrapper = mount(PartnerDetailPage)
    await flushPromises()

    expect(wrapper.text()).toContain('Test Partner')
  })

  it('renders the form in info tab', async () => {
    mockPartnerApiCalls()

    const wrapper = mount(PartnerDetailPage)
    await flushPromises()

    expect(wrapper.find('[data-partner-form]').exists()).toBe(true)
  })

  it('navigates to partner list on back button', async () => {
    mockPartnerApiCalls()

    const wrapper = mount(PartnerDetailPage)
    await flushPromises()

    await wrapper.find('[data-back-btn]').trigger('click')
    expect(mockNavigateTo).toHaveBeenCalledWith('/hub/partners')
  })
})
