import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../helpers/stubs'
import type { InvoiceRow } from '#billing/types/billing'

mockUseI18n()

const InvoiceStatusBadge = (await import('#billing/components/InvoiceStatusBadge.vue')).default

function makeInvoice(overrides: Partial<InvoiceRow> = {}): InvoiceRow {
  return {
    id: 1,
    partner_id: 1,
    invoice_number: 'INV-0001',
    invoice_date: '2026-03-01',
    due_date: '2099-12-31',
    subtotal_ht: 100,
    tax_rate: 20,
    tax_amount: 20,
    total_ttc: 120,
    status: 'draft',
    paid_at: null,
    payment_method: null,
    credited_invoice_id: null,
    created_at: '2026-03-01T00:00:00Z',
    ...overrides,
  }
}

describe('InvoiceStatusBadge', () => {
  it('renders draft status with gray color', () => {
    const wrapper = mount(InvoiceStatusBadge, {
      props: { invoice: makeInvoice({ status: 'draft' }) },
    })
    expect(wrapper.text()).toBe('billing.status.draft')
    expect(wrapper.find('[data-status="draft"]').exists()).toBe(true)
    expect(wrapper.find('span').classes()).toContain('bg-gray-100')
  })

  it('renders sent status with blue color', () => {
    const wrapper = mount(InvoiceStatusBadge, {
      props: { invoice: makeInvoice({ status: 'sent', due_date: '2099-12-31' }) },
    })
    expect(wrapper.text()).toBe('billing.status.sent')
    expect(wrapper.find('[data-status="sent"]').exists()).toBe(true)
    expect(wrapper.find('span').classes()).toContain('bg-blue-100')
  })

  it('renders paid status with green color', () => {
    const wrapper = mount(InvoiceStatusBadge, {
      props: { invoice: makeInvoice({ status: 'paid' }) },
    })
    expect(wrapper.text()).toBe('billing.status.paid')
    expect(wrapper.find('[data-status="paid"]').exists()).toBe(true)
    expect(wrapper.find('span').classes()).toContain('bg-green-100')
  })

  it('renders credited status with orange color', () => {
    const wrapper = mount(InvoiceStatusBadge, {
      props: { invoice: makeInvoice({ status: 'credited' }) },
    })
    expect(wrapper.text()).toBe('billing.status.credited')
    expect(wrapper.find('[data-status="credited"]').exists()).toBe(true)
    expect(wrapper.find('span').classes()).toContain('bg-orange-100')
  })

  it('renders overdue when sent and due_date is past', () => {
    const wrapper = mount(InvoiceStatusBadge, {
      props: { invoice: makeInvoice({ status: 'sent', due_date: '2020-01-01' }) },
    })
    expect(wrapper.text()).toBe('billing.status.overdue')
    expect(wrapper.find('[data-status="overdue"]').exists()).toBe(true)
    expect(wrapper.find('span').classes()).toContain('bg-red-100')
  })

  it('does not render overdue when paid even if due_date is past', () => {
    const wrapper = mount(InvoiceStatusBadge, {
      props: { invoice: makeInvoice({ status: 'paid', due_date: '2020-01-01' }) },
    })
    expect(wrapper.text()).toBe('billing.status.paid')
    expect(wrapper.find('[data-status="paid"]').exists()).toBe(true)
  })
})
