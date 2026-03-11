import { ref, toValue, type MaybeRef } from 'vue'
import { useApi } from '@/composables/useApi'
import type { CampaignStats } from '@/types/campaign'

export type CampaignStatsErrorType = 'not_yet' | 'provider' | 'only_sent' | null

export function useCampaignStats(campaignId: MaybeRef<number>) {
  const api = useApi()

  const stats = ref<CampaignStats | null>(null)
  const isLoading = ref(false)
  const errorType = ref<CampaignStatsErrorType>(null)
  const availableAt = ref<string | null>(null)

  async function fetchStats(): Promise<void> {
    isLoading.value = true
    errorType.value = null
    availableAt.value = null

    try {
      const { data, error, response } = await api.GET('/campaigns/{campaign}/stats' as never, {
        params: { path: { campaign: toValue(campaignId) } },
      } as never)

      if (error) {
        const status = (response as Response | undefined)?.status
        const body = error as Record<string, unknown>

        if (status === 422 && body.message === 'Stats only available for sent campaigns.') {
          errorType.value = 'only_sent'
        }
        else if (status === 422) {
          errorType.value = 'not_yet'
          availableAt.value = typeof body.available_at === 'string' ? body.available_at : null
        }
        else {
          errorType.value = 'provider'
        }

        return
      }

      if (data) {
        stats.value = (data as { data: CampaignStats }).data
      }
    }
    catch {
      errorType.value = 'provider'
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    stats,
    isLoading,
    errorType,
    availableAt,
    fetchStats,
  }
}
