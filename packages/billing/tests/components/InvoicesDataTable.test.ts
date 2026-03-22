import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../helpers/stubs'
import type { InvoiceRow } from '#billing/types/billing'

mockUseI18n()

// Stub the child component
vi.stubGlobal('InvoiceStatusBadge', {
  template: '<span data-stub="badge">{{ invoice.status }}</span>',
  props: ['invoice'],
})

const InvoicesDataTable = (await import('#billing/components/InvoicesDataTable.vue')).default

const fakeInvoices: InvoiceRow[] = [
  {
    id: 1,
    partner_id: 10,
    invoice_number: 'INV-0001',
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
  },
  {
    id: 2,
    partner_id: 10,
    invoice_number: 'INV-0002',
    invoice_date: '2026-02-01',
    due_date: '2020-01-01',
    subtotal_ht: 500,
    tax_rate: 20,
    tax_amount: 100,
    total_ttc: 600,
    status: 'sent',
    paid_at: null,
    payment_method: null,
    credited_invoice_id: null,
    created_at: '2026-02-01T00:00:00Z',
  },
]

describe('InvoicesDataTable', () => {
  it('renders rows for each invoice', () => {
    const wrapper = mount(InvoicesDataTable, {
      props: { invoices: fakeInvoices, isLoading: false },
      global: {
        stubs: {
          InvoiceStatusBadge: {
            template: '<span data-stub="badge">{{ invoice.status }}</span>',
            props: ['invoice'],
          },
        },
      },
    })
    const rows = wrapper.findAll('[data-row-id]')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.text()).toContain('INV-0001')
  })

  it('highlights overdue rows with red background', () => {
    const wrapper = mount(InvoicesDataTable, {
      props: { invoices: fakeInvoices, isLoading: false },
      global: {
        stubs: {
          InvoiceStatusBadge: {
            template: '<span>{{ invoice.status }}</span>',
            props: ['invoice'],
          },
        },
      },
    })
    // Second invoice has past due_date + status sent -> overdue
    const overdueRow = wrapper.find('[data-row-id="2"]')
    expect(overdueRow.classes()).toContain('bg-red-50')
  })

  it('emits select when row is clicked', async () => {
    const wrapper = mount(InvoicesDataTable, {
      props: { invoices: fakeInvoices, isLoading: false },
      global: {
        stubs: {
          InvoiceStatusBadge: {
            template: '<span>{{ invoice.status }}</span>',
            props: ['invoice'],
          },
        },
      },
    })
    await wrapper.find('[data-row-id="1"]').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual([1])
  })

  it('shows empty state when no invoices', () => {
    const wrapper = mount(InvoicesDataTable, {
      props: { invoices: [], isLoading: false },
    })
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
  })

  it('shows loading state', () => {
    const wrapper = mount(InvoicesDataTable, {
      props: { invoices: [], isLoading: true },
    })
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
  })
})
