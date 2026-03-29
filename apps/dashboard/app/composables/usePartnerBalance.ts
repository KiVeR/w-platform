import { ref } from 'vue'

export interface PartnerBalance {
  euro_credits: number
}

export function usePartnerBalance() {
  const balance = ref<PartnerBalance | null>(null)
  const isLoading = ref(false)
  const hasError = ref(false)

  async function fetchBalance(partnerId: number) {
    isLoading.value = true
    hasError.value = false
    try {
      // TODO: implement API call when endpoint is ready
      balance.value = null
    } catch {
      hasError.value = true
    } finally {
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
