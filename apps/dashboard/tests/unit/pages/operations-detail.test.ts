import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { mockUseI18n } from '../../helpers/stubs'

vi.stubGlobal('definePageMeta', vi.fn())
mockUseI18n()

vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRoute', () => ({ params: { id: '42' } }))
vi.stubGlobal('onMounted', (fn: Function) => fn())
vi.stubGlobal('useScopedNavigation', () => ({ scopedRoute: (p: string) => p, hubRoute: (p: string) => p, enterPartner: vi.fn(), exitToHub: vi.fn() }))

const operation = ref<any>(null)
const isLoadingDetail = ref(false)
const hasDetailError = ref(false)
const fetchOperation = vi.fn()
const refreshOperation = vi.fn()

vi.stubGlobal('useOperationDetail', () => ({
  operation,
  isLoading: isLoadingDetail,
  hasError: hasDetailError,
  fetchOperation,
  refreshOperation,
}))

const transitions = ref<any[]>([])
const isLoadingHistory = ref(false)
const isTransitioning = ref(false)
const applyTransition = vi.fn()
const fetchTransitionHistory = vi.fn()

vi.stubGlobal('useOperationTransitions', () => ({
  transitions,
  isLoadingHistory,
  isTransitioning,
  applyTransition,
  fetchTransitionHistory,
}))

const OperationsDetail = (await import('@/pages/operations/[id].vue')).default

describe('operations detail page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    operation.value = null
    isLoadingDetail.value = false
    hasDetailError.value = false
  })

  it('calls fetchOperation and fetchTransitionHistory on mount', async () => {
    mount(OperationsDetail, {
      global: {
        stubs: {
          OperationDetailPanel: { template: '<div />', props: ['operation', 'transitions', 'isLoadingTransitions', 'isTransitioning'] },
        },
      },
    })
    await flushPromises()
    expect(fetchOperation).toHaveBeenCalledWith(42)
    expect(fetchTransitionHistory).toHaveBeenCalledWith(42)
  })

  it('shows error state when detail fails to load', () => {
    hasDetailError.value = true
    const wrapper = mount(OperationsDetail, {
      global: {
        stubs: {
          OperationDetailPanel: { template: '<div />', props: ['operation', 'transitions', 'isLoadingTransitions', 'isTransitioning'] },
        },
      },
    })
    expect(wrapper.find('[data-testid="error-state"]').exists()).toBe(true)
  })
})
