import { ref } from 'vue'
import type { InvoiceDetail, InvoiceStatus, InvoiceLine } from '#billing/types/billing'

export function useInvoiceDetail() {
  const api = useNuxtApp().$api as { GET: Function }

  const invoice = ref<InvoiceDetail | null>(null)
  const isLoading = ref(false)
  const hasError = ref(false)

  function mapLine(raw: Record<string, unknown>): InvoiceLine {
    return {
      id: Number(raw.id),
      invoice_id: Number(raw.invoice_id),
      operation_id: raw.operation_id != null ? Number(raw.operation_id) : null,
      description: String(raw.description ?? ''),
      quantity: Number(raw.quantity ?? 0),
      unit_price: Number(raw.unit_price ?? 0),
      total_ht: Number(raw.total_ht ?? 0),
      tax_rate: Number(raw.tax_rate ?? 0),
      tax_amount: Number(raw.tax_amount ?? 0),
    }
  }

  function mapInvoiceDetail(raw: Record<string, unknown>): InvoiceDetail {
    const partner = raw.partner as Record<string, unknown> | undefined
    const lines = raw.lines as Record<string, unknown>[] | undefined
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
      notes: raw.notes ? String(raw.notes) : null,
      partner: partner ? { id: Number(partner.id), name: String(partner.name) } : undefined,
      lines: lines ? lines.map(mapLine) : undefined,
    }
  }

  async function fetchInvoice(id: number): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      const { data, error } = await api.GET('/invoices/{id}', {
        params: { path: { id }, query: { include: 'partner,lines' } },
      })
      if (error) {
        hasError.value = true
        return
      }
      if (data) {
        const raw = data as { data: Record<string, unknown> }
        invoice.value = mapInvoiceDetail(raw.data)
      }
    }
    catch {
      hasError.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    invoice,
    isLoading,
    hasError,
    fetchInvoice,
  }
}
