export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'credited'

export interface InvoiceRow {
  id: number
  partner_id: number
  invoice_number: string
  invoice_date: string
  due_date: string
  subtotal_ht: number
  tax_rate: number
  tax_amount: number
  total_ttc: number
  status: InvoiceStatus
  paid_at: string | null
  payment_method: string | null
  credited_invoice_id: number | null
  created_at: string
}

export interface InvoiceDetail extends InvoiceRow {
  notes: string | null
  partner?: { id: number; name: string }
  lines?: InvoiceLine[]
}

export interface InvoiceLine {
  id: number
  invoice_id: number
  operation_id: number | null
  description: string
  quantity: number
  unit_price: number
  total_ht: number
  tax_rate: number
  tax_amount: number
}

export interface InvoiceFilters {
  status?: InvoiceStatus
  search?: string
}

export interface InvoicePagination {
  page: number
  lastPage: number
  total: number
}

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; i18nKey: string }> = {
  draft: { label: 'Brouillon', color: 'gray', i18nKey: 'billing.status.draft' },
  sent: { label: 'Envoyee', color: 'blue', i18nKey: 'billing.status.sent' },
  paid: { label: 'Payee', color: 'green', i18nKey: 'billing.status.paid' },
  credited: { label: 'Avoir', color: 'orange', i18nKey: 'billing.status.credited' },
}

export const OVERDUE_CONFIG = { label: 'En retard', color: 'red', i18nKey: 'billing.status.overdue' }

/**
 * overdue is computed frontend-only, NEVER sent to the API.
 * An invoice is overdue when its status is 'sent' and due_date is in the past.
 */
export function isOverdue(invoice: InvoiceRow): boolean {
  return invoice.status === 'sent' && new Date(invoice.due_date) < new Date()
}

export interface PartnerBalance {
  partner_id: number
  euro_credits: number
}
