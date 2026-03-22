import { ref } from 'vue'
import type { InvoiceRow, InvoiceFilters, InvoicePagination, InvoiceStatus } from '#billing/types/billing'

export function useInvoices() {
  const api = useNuxtApp().$api as { GET: Function }

  const invoices = ref<InvoiceRow[]>([])
  const pagination = ref<InvoicePagination>({ page: 1, lastPage: 1, total: 0 })
  const isLoading = ref(false)
  const hasError = ref(false)
  const filters = ref<InvoiceFilters>({})
  const sort = ref('-invoice_date')

  function mapInvoice(raw: Record<string, unknown>): InvoiceRow {
    return {
      id: Number(raw.id),
      partner_id: Number(raw.partner_id),
      invoice_number: String(raw.invoice_number ?? ''),
      invoice_date: String(raw.invoice_date ?? ''),
      due_date: String(raw.due_date ?? ''),
      subtotal_ht: Number(raw.subtotal_ht ?? 0),
      tax_rate: Number(raw.tax_rate ?? 0),
      tax_amount: Number(raw.tax_amount ?? 0),
      total_ttc: Number(raw.total_ttc ?? 0),
      status: String(raw.status ?? 'draft') as InvoiceStatus,
      paid_at: raw.paid_at ? String(raw.paid_at) : null,
      payment_method: raw.payment_method ? String(raw.payment_method) : null,
      credited_invoice_id: raw.credited_invoice_id != null ? Number(raw.credited_invoice_id) : null,
      created_at: String(raw.created_at ?? ''),
    }
  }

  async function fetchInvoices(): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      const query: Record<string, unknown> = {
        sort: sort.value,
        page: pagination.value.page,
      }
      if (filters.value.status) {
        query['filter[status]'] = filters.value.status
      }
      if (filters.value.search) {
        query['filter[invoice_number]'] = filters.value.search
      }

      const { data, error } = await api.GET('/invoices', {
        params: { query },
      })
      if (error) {
        hasError.value = true
        return
      }
      if (data) {
        const raw = data as { data: Record<string, unknown>[]; meta: Record<string, unknown> }
        invoices.value = raw.data.map(mapInvoice)
        pagination.value = {
          page: Number(raw.meta.current_page),
          lastPage: Number(raw.meta.last_page),
          total: Number(raw.meta.total),
        }
      }
    }
    catch {
      hasError.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  async function setPage(page: number): Promise<void> {
    pagination.value.page = page
    await fetchInvoices()
  }

  async function setSort(field: string): Promise<void> {
    const currentField = sort.value.replace(/^-/, '')
    if (currentField === field) {
      sort.value = sort.value.startsWith('-') ? field : `-${field}`
    }
    else {
      sort.value = `-${field}`
    }
    await fetchInvoices()
  }

  function setFilters(f: Partial<InvoiceFilters>): void {
    Object.assign(filters.value, f)
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
