import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export interface CreditBalance {
  partner_id: number
  euro_credits: number
}

export interface Transaction {
  id: number
  type: string
  amount: number
  balance_after: number
  description: string
  created_at: string
}

export function usePartnerCredits() {
  const api = useApi()

  const balance = ref<CreditBalance | null>(null)
  const transactions = ref<Transaction[]>([])
  const isLoadingBalance = ref(false)
  const isLoadingTransactions = ref(false)
  const isRecharging = ref(false)
  const hasError = ref(false)
  const rechargeError = ref<string | null>(null)

  async function fetchBalance(partnerId: number): Promise<void> {
    isLoadingBalance.value = true
    hasError.value = false
    try {
      const { data, error } = await api.GET('/partners/{partner}/balance', {
        params: { path: { partner: partnerId } },
      } as never)

      if (error) {
        hasError.value = true
        return
      }

      if (data) {
        const raw = data as { data: Record<string, unknown> }
        balance.value = {
          partner_id: Number(raw.data.partner_id),
          euro_credits: parseFloat(String(raw.data.euro_credits ?? '0')),
        }
      }
    }
    catch {
      hasError.value = true
    }
    finally {
      isLoadingBalance.value = false
    }
  }

  async function fetchTransactions(partnerId: number): Promise<void> {
    isLoadingTransactions.value = true
    try {
      const { data, error } = await api.GET('/partners/{partner}/transactions', {
        params: { path: { partner: partnerId } },
      } as never)

      if (error) return

      if (data) {
        const raw = data as { data: Record<string, unknown>[] }
        transactions.value = raw.data.map(tx => ({
          id: Number(tx.id),
          type: String(tx.type ?? ''),
          amount: parseFloat(String(tx.amount ?? '0')),
          balance_after: parseFloat(String(tx.balance_after ?? '0')),
          description: String(tx.description ?? ''),
          created_at: String(tx.created_at ?? ''),
        }))
      }
    }
    catch {
      // Silently fail for transactions
    }
    finally {
      isLoadingTransactions.value = false
    }
  }

  async function rechargeCredits(
    partnerId: number,
    amount: number,
    description: string,
  ): Promise<boolean> {
    isRecharging.value = true
    rechargeError.value = null
    try {
      const { error } = await api.POST('/partners/{partner}/credits', {
        params: { path: { partner: partnerId } },
        body: { amount, description },
      } as never)

      if (error) {
        rechargeError.value = 'recharge_failed'
        return false
      }

      // Refresh data after recharge
      await Promise.all([
        fetchBalance(partnerId),
        fetchTransactions(partnerId),
      ])
      return true
    }
    catch {
      rechargeError.value = 'recharge_failed'
      return false
    }
    finally {
      isRecharging.value = false
    }
  }

  return {
    balance,
    transactions,
    isLoadingBalance,
    isLoadingTransactions,
    isRecharging,
    hasError,
    rechargeError,
    fetchBalance,
    fetchTransactions,
    rechargeCredits,
  }
}
