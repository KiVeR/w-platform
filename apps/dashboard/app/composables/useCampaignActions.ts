import { ref, toValue, type MaybeRef } from 'vue'
import { useApi } from '@/composables/useApi'

export function useCampaignActions(campaignId: MaybeRef<number>) {
  const api = useApi()

  const isCancelling = ref(false)
  const cancelError = ref<string | null>(null)

  async function cancelCampaign(): Promise<boolean> {
    isCancelling.value = true
    cancelError.value = null

    try {
      const { error } = await api.POST('/campaigns/{campaign}/cancel' as never, {
        params: {
          path: { campaign: toValue(campaignId) },
        },
      } as never)

      if (error) {
        cancelError.value = 'cancel_error'
        return false
      }

      return true
    }
    catch {
      cancelError.value = 'cancel_error'
      return false
    }
    finally {
      isCancelling.value = false
    }
  }

  return {
    isCancelling,
    cancelError,
    cancelCampaign,
  }
}
