import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtApp } from '../helpers/stubs'
import { useInvoices } from '#billing/composables/useInvoices'
import { isOverdue } from '#billing/types/billing'
import type { InvoiceRow } from '#billing/types/billing'

const mockGet = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockNuxtApp({ GET: mockGet })
})

const fakePaginationMeta = {
  current_page: 1,
  last_page: 2,
  total: 15,
}

function fakeInvoiceList(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    partner_id: 10,
    invoice_number: 'INV-' + String(i + 1).padStart(4, '0'),
    invoice_date: '2026-03-01',
    due_date: '2026-04-01',
    subtotal_ht: 1000,
    tax_rate: 20,
    tax_amount: 200,
    total_ttc: 1200,
    status: 'sent',
    paid_at: null,
    payment_method: null,
    credited_invoice_id: null,
    created_at: '2026-03-01T00:00:00Z',
  }))
}

describe('useInvoices', () => {
  it('fetchInvoices calls GET /invoices and maps data + pagination', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeInvoiceList(3), meta: fakePaginationMeta },
    })

    const { invoices, pagination, fetchInvoices } = useInvoices()
    await fetchInvoices()

    expect(mockGet).toHaveBeenCalledWith('/invoices', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          sort: '-invoice_date',
          page: 1,
        }),
      }),
    }))
    expect(invoices.value).toHaveLength(3)
    expect(invoices.value[0]!.id).toBe(1)
    expect(invoices.value[0]!.invoice_number).toBe('INV-0001')
    expect(pagination.value.total).toBe(15)
    expect(pagination.value.lastPage).toBe(2)
  })

  it('passes filter params when set', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, total: 0, last_page: 1 } },
    })

    const { setFilters, fetchInvoices } = useInvoices()
    setFilters({ status: 'paid', search: 'INV-0042' })
    await fetchInvoices()

    expect(mockGet).toHaveBeenCalledWith('/invoices', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          'filter[status]': 'paid',
          'filter[invoice_number]': 'INV-0042',
        }),
      }),
    }))
  })

  it('sets hasError when API returns error', async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { status: 500 } })

    const { hasError, isLoading, fetchInvoices } = useInvoices()
    await fetchInvoices()

    expect(hasError.value).toBe(true)
    expect(isLoading.value).toBe(false)
  })

  it('resets hasError on successful fetch after error', async () => {
    mockGet.mockResolvedValueOnce({ data: undefined, error: { status: 500 } })
    mockGet.mockResolvedValueOnce({
      data: { data: fakeInvoiceList(1), meta: fakePaginationMeta },
    })

    const { hasError, fetchInvoices } = useInvoices()
    await fetchInvoices()
    expect(hasError.value).toBe(true)

    await fetchInvoices()
    expect(hasError.value).toBe(false)
  })
})

describe('isOverdue (frontend-only)', () => {
  it('returns true when status is sent and due_date is past', () => {
    const invoice: InvoiceRow = {
      id: 1, partner_id: 1, invoice_number: 'INV-0001',
      invoice_date: '2026-01-01', due_date: '2026-01-15',
      subtotal_ht: 100, tax_rate: 20, tax_amount: 20, total_ttc: 120,
      status: 'sent', paid_at: null, payment_method: null,
      credited_invoice_id: null, created_at: '2026-01-01T00:00:00Z',
    }
    expect(isOverdue(invoice)).toBe(true)
  })

  it('returns false when status is paid even if due_date is past', () => {
    const invoice: InvoiceRow = {
      id: 1, partner_id: 1, invoice_number: 'INV-0001',
      invoice_date: '2026-01-01', due_date: '2026-01-15',
      subtotal_ht: 100, tax_rate: 20, tax_amount: 20, total_ttc: 120,
      status: 'paid', paid_at: '2026-01-10', payment_method: 'bank_transfer',
      credited_invoice_id: null, created_at: '2026-01-01T00:00:00Z',
    }
    expect(isOverdue(invoice)).toBe(false)
  })

  it('returns false when status is sent but due_date is in the future', () => {
    const invoice: InvoiceRow = {
      id: 1, partner_id: 1, invoice_number: 'INV-0001',
      invoice_date: '2026-01-01', due_date: '2099-12-31',
      subtotal_ht: 100, tax_rate: 20, tax_amount: 20, total_ttc: 120,
      status: 'sent', paid_at: null, payment_method: null,
      credited_invoice_id: null, created_at: '2026-01-01T00:00:00Z',
    }
    expect(isOverdue(invoice)).toBe(false)
  })

  it('never sends overdue as a filter param to the API', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, total: 0, last_page: 1 } },
    })

    const { setFilters, fetchInvoices } = useInvoices()
    // setFilters only accepts status from InvoiceStatus type (no 'overdue')
    setFilters({ status: 'sent' })
    await fetchInvoices()

    const callArgs = mockGet.mock.calls[0][1]
    const query = callArgs.params.query
    // Verify no overdue filter is sent
    expect(query['filter[status]']).toBe('sent')
    expect(Object.values(query)).not.toContain('overdue')
  })
})
