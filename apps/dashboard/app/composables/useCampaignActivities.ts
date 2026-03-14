import { ref, type MaybeRefOrGetter, toValue } from 'vue'
import { useApi } from '@/composables/useApi'
import type { LogActivityRow } from '@/types/campaign'

function optionalNumber(value: unknown): number | null {
  return value ? Number(value) : null
}

function mapActivity(raw: Record<string, unknown>): LogActivityRow {
  return {
    id: Number(raw.id),
    event: String(raw.event ?? ''),
    model_type: raw.model_type ? String(raw.model_type) : null,
    model_id: optionalNumber(raw.model_id),
    old_values: raw.old_values as Record<string, unknown> | null ?? null,
    new_values: raw.new_values as Record<string, unknown> | null ?? null,
    created_at: String(raw.created_at ?? ''),
  }
}

export function useCampaignActivities(campaignId: MaybeRefOrGetter<number>) {
  const api = useApi()

  const activities = ref<LogActivityRow[]>([])
  const isLoading = ref(false)
  const hasError = ref(false)

  async function fetchActivities(): Promise<void> {
    isLoading.value = true
    hasError.value = false

    try {
      const { data, error } = await api.GET('/campaigns/{campaign}/activities' as never, {
        params: { path: { campaign: toValue(campaignId) } },
      } as never)

      if (error) {
        hasError.value = true
        return
      }

      if (data) {
        const raw = data as { data: Record<string, unknown>[] }
        activities.value = raw.data
          .map(mapActivity)
          .sort((left, right) => right.created_at.localeCompare(left.created_at))
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
    activities,
    isLoading,
    hasError,
    fetchActivities,
  }
}
