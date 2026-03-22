import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { mockUseI18n } from '../../helpers/stubs'

vi.stubGlobal('definePageMeta', vi.fn())
mockUseI18n()

const navigateToMock = vi.fn()
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('onMounted', (fn: Function) => fn())

const operations = ref<any[]>([])
const pagination = ref({ page: 1, lastPage: 1, total: 0 })
const isLoading = ref(false)
const hasError = ref(false)
const fetchOperations = vi.fn()
const setFilters = vi.fn()
const setPage = vi.fn()

vi.stubGlobal('useOperations', () => ({
  operations,
  pagination,
  isLoading,
  hasError,
  fetchOperations,
  setFilters,
  setPage,
}))

const OperationsIndex = (await import('@/pages/operations/index.vue')).default

describe('operations index page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    operations.value = []
    isLoading.value = false
    hasError.value = false
    pagination.value = { page: 1, lastPage: 1, total: 0 }
  })

  it('renders page title', () => {
    const wrapper = mount(OperationsIndex, {
      global: {
        stubs: {
          OperationsDataTable: { template: '<div data-stub="table" />', props: ['operations', 'isLoading'] },
        },
      },
    })
    expect(wrapper.text()).toContain('nav.operations')
  })

  it('calls fetchOperations on mount', () => {
    mount(OperationsIndex, {
      global: {
        stubs: {
          OperationsDataTable: { template: '<div />', props: ['operations', 'isLoading'] },
        },
      },
    })
    expect(fetchOperations).toHaveBeenCalled()
  })

  it('shows error state when hasError is true', () => {
    hasError.value = true
    const wrapper = mount(OperationsIndex, {
      global: {
        stubs: {
          OperationsDataTable: { template: '<div />', props: ['operations', 'isLoading'] },
        },
      },
    })
    expect(wrapper.find('[data-testid="error-state"]').exists()).toBe(true)
  })
})
