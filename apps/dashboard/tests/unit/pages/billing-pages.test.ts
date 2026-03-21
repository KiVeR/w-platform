import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { mockUseI18n } from '../../helpers/stubs'

vi.stubGlobal('ref', ref)
vi.stubGlobal('definePageMeta', vi.fn())
mockUseI18n()

vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRoute', () => ({ params: { id: '5' } }))
vi.stubGlobal('onMounted', (fn: Function) => fn())

// Stubs for billing index page composables
const invoices = ref<any[]>([])
const isLoadingInvoices = ref(false)
const hasInvoiceError = ref(false)
const fetchInvoices = vi.fn()
const setFilters = vi.fn()

vi.stubGlobal('useInvoices', () => ({
  invoices,
  pagination: ref({ page: 1, lastPage: 1, total: 0 }),
  isLoading: isLoadingInvoices,
  hasError: hasInvoiceError,
  filters: ref({}),
  sort: ref('-invoice_date'),
  fetchInvoices,
  setPage: vi.fn(),
  setSort: vi.fn(),
  setFilters,
}))

const balance = ref<any>(null)
const isLoadingBalance = ref(false)
const fetchBalance = vi.fn()

vi.stubGlobal('usePartnerBalance', () => ({
  balance,
  isLoading: isLoadingBalance,
  hasError: ref(false),
  fetchBalance,
}))

// Stubs for billing detail page
const invoice = ref<any>(null)
const isLoadingDetail = ref(false)
const hasDetailError = ref(false)
const fetchInvoice = vi.fn()

vi.stubGlobal('useInvoiceDetail', () => ({
  invoice,
  isLoading: isLoadingDetail,
  hasError: hasDetailError,
  fetchInvoice,
}))

describe('billing index page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invoices.value = []
    isLoadingInvoices.value = false
    hasInvoiceError.value = false
    balance.value = null
    isLoadingBalance.value = false
  })

  it('calls fetchInvoices on mount', async () => {
    const BillingIndex = (await import('@/pages/billing/index.vue')).default
    mount(BillingIndex, {
      global: {
        stubs: {
          InvoicesDataTable: { template: '<div data-stub="table" />', props: ['invoices', 'isLoading'] },
          PartnerBalanceCard: { template: '<div data-stub="balance" />', props: ['euroCredits', 'isLoading'] },
          BillingQueueCard: { template: '<div data-stub="queue" />', props: ['pendingCount', 'isLoading'] },
        },
      },
    })
    await flushPromises()
    expect(fetchInvoices).toHaveBeenCalled()
  })

  it('shows error state when invoices fail to load', async () => {
    hasInvoiceError.value = true
    const BillingIndex = (await import('@/pages/billing/index.vue')).default
    const wrapper = mount(BillingIndex, {
      global: {
        stubs: {
          InvoicesDataTable: { template: '<div data-stub="table" />', props: ['invoices', 'isLoading'] },
          PartnerBalanceCard: { template: '<div data-stub="balance" />', props: ['euroCredits', 'isLoading'] },
          BillingQueueCard: { template: '<div data-stub="queue" />', props: ['pendingCount', 'isLoading'] },
        },
      },
    })
    expect(wrapper.find('[data-testid="error-state"]').exists()).toBe(true)
  })
})

describe('billing detail page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invoice.value = null
    isLoadingDetail.value = false
    hasDetailError.value = false
  })

  it('calls fetchInvoice on mount with route param id', async () => {
    const BillingDetail = (await import('@/pages/billing/[id].vue')).default
    mount(BillingDetail, {
      global: {
        stubs: {
          InvoiceDetailCard: { template: '<div data-stub="detail" />', props: ['invoice'] },
        },
      },
    })
    await flushPromises()
    expect(fetchInvoice).toHaveBeenCalledWith(5)
  })

  it('shows error state when detail fails to load', async () => {
    hasDetailError.value = true
    const BillingDetail = (await import('@/pages/billing/[id].vue')).default
    const wrapper = mount(BillingDetail, {
      global: {
        stubs: {
          InvoiceDetailCard: { template: '<div data-stub="detail" />', props: ['invoice'] },
        },
      },
    })
    expect(wrapper.find('[data-testid="error-state"]').exists()).toBe(true)
  })
})
