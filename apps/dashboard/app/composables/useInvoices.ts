import { ref } from 'vue'

export interface Invoice {
  id: number
  ref_invoice: string
  invoice_date: string
  amount_ht: number
  amount_ttc: number
  status: string
  partner_id: number
}

export interface InvoiceFilters {
  ref_invoice?: string
  status?: string
  date_from?: string
  date_to?: string
}

export function useInvoices() {
  const invoices = ref<Invoice[]>([])
  const pagination = ref({ page: 1, lastPage: 1, total: 0 })
  const isLoading = ref(false)
  const hasError = ref(false)
  const filters = ref<InvoiceFilters>({})
  const sort = ref('-invoice_date')

  async function fetchInvoices() {
    isLoading.value = true
    hasError.value = false
    try {
      // TODO: implement API call when endpoint is ready
      invoices.value = []
    } catch {
      hasError.value = true
    } finally {
      isLoading.value = false
    }
  }

  function setPage(page: number) {
    pagination.value.page = page
    return fetchInvoices()
  }

  function setSort(field: string) {
    sort.value = sort.value === field ? `-${field}` : field
    return fetchInvoices()
  }

  function setFilters(f: Partial<InvoiceFilters>) {
    filters.value = { ...filters.value, ...f }
    pagination.value.page = 1
  }

  return {
    invoices,
    pagination,
    isLoading,
    hasError,
    filters,
    sort,
    fetchInvoices,
    setPage,
    setSort,
    setFilters,
  }
}
