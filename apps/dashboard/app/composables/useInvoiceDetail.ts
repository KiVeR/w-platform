import { ref } from 'vue'
import type { Invoice } from './useInvoices'

export function useInvoiceDetail() {
  const invoice = ref<Invoice | null>(null)
  const isLoading = ref(false)
  const hasError = ref(false)

  async function fetchInvoice(id: number) {
    isLoading.value = true
    hasError.value = false
    try {
      // TODO: implement API call when endpoint is ready
      invoice.value = null
    } catch {
      hasError.value = true
    } finally {
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
