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

  const isRoutingActionPending = ref(false)
  const routingActionError = ref<string | null>(null)

  function makeRoutingAction(endpoint: string): () => Promise<boolean> {
    return async (): Promise<boolean> => {
      isRoutingActionPending.value = true
      routingActionError.value = null
      try {
        const { error } = await api.POST(endpoint as never, {
          params: { path: { campaign: toValue(campaignId) } },
        } as never)
        if (error) {
          routingActionError.value = 'routing_error'
          return false
        }
        return true
      }
      catch {
        routingActionError.value = 'routing_error'
        return false
      }
      finally {
        isRoutingActionPending.value = false
      }
    }
  }

  const startRouting = makeRoutingAction('/campaigns/{campaign}/routing/start')
  const pauseRouting = makeRoutingAction('/campaigns/{campaign}/routing/pause')
  const cancelRouting = makeRoutingAction('/campaigns/{campaign}/routing/cancel')
  const pullReport = makeRoutingAction('/campaigns/{campaign}/pull-report')

  return {
    isCancelling,
    cancelError,
    cancelCampaign,
    isRoutingActionPending,
    routingActionError,
    startRouting,
    pauseRouting,
    cancelRouting,
    pullReport,
  }
}
