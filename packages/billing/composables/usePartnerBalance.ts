import { ref } from 'vue'
import type { PartnerBalance } from '#billing/types/billing'

export function usePartnerBalance() {
  const api = useNuxtApp().$api as { GET: Function }

  const balance = ref<PartnerBalance | null>(null)
  const isLoading = ref(false)
  const hasError = ref(false)

  async function fetchBalance(partnerId: number): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      const { data, error } = await api.GET('/partners/{id}/balance', {
        params: { path: { id: partnerId } },
      })
      if (error) {
        hasError.value = true
        return
      }
      if (data) {
        const raw = data as { data: Record<string, unknown> }
        balance.value = {
          partner_id: Number(raw.data.partner_id ?? partnerId),
          euro_credits: Number(raw.data.euro_credits ?? 0),
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

  return {
    balance,
    isLoading,
    hasError,
    fetchBalance,
  }
}
