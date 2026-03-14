import { ref, type MaybeRefOrGetter, toValue } from 'vue'
import { useApi } from '@/composables/useApi'
import type { CampaignLogRow } from '@/types/campaign'

function mapLog(raw: Record<string, unknown>): CampaignLogRow {
  return {
    id: Number(raw.id),
    campaign_id: Number(raw.campaign_id),
    data: raw.data as Record<string, unknown> ?? {},
    created_at: String(raw.created_at ?? ''),
  }
}

export function useCampaignLogs(campaignId: MaybeRefOrGetter<number>) {
  const api = useApi()

  const logs = ref<CampaignLogRow[]>([])
  const isLoading = ref(false)
  const hasError = ref(false)

  async function fetchLogs(): Promise<void> {
    isLoading.value = true
    hasError.value = false

    try {
      const { data, error } = await api.GET('/campaigns/{campaign}/logs' as never, {
        params: { path: { campaign: toValue(campaignId) } },
      } as never)

      if (error) {
        hasError.value = true
        return
      }

      if (data) {
        const raw = data as { data: Record<string, unknown>[] }
        logs.value = raw.data.map(mapLog)
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
    logs,
    isLoading,
    hasError,
    fetchLogs,
  }
}
