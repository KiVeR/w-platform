import { ref, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { usePartnerScope } from '@/composables/usePartnerScope'
import { usePartnerStore } from '@/stores/partner'

export interface LastCampaignInfo {
  id: number
  name: string
  volume: number | null
  sentAt: string
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

function getStorageKey(partnerId: number | null): string {
  return `re-engagement-dismissed-${partnerId ?? 'none'}`
}

function daysBetween(date1: Date, date2: Date): number {
  return Math.floor(Math.abs(date2.getTime() - date1.getTime()) / MS_PER_DAY)
}

export function useReEngagementBanner() {
  const api = useApi()
  const { withPartnerScope } = usePartnerScope()
  const partner = usePartnerStore()

  const lastCampaign = ref<LastCampaignInfo | null>(null)
  const isLoading = ref(false)

  const isDismissed = ref(
    sessionStorage.getItem(getStorageKey(partner.effectivePartnerId)) === 'true',
  )

  const daysSinceLastSend = computed<number | null>(() => {
    if (!lastCampaign.value) return null
    return daysBetween(new Date(lastCampaign.value.sentAt), new Date())
  })

  const shouldShow = computed(() => {
    if (isDismissed.value) return false
    if (daysSinceLastSend.value === null) return false
    return daysSinceLastSend.value >= 25 && daysSinceLastSend.value <= 35
  })

  function dismiss(): void {
    isDismissed.value = true
    sessionStorage.setItem(getStorageKey(partner.effectivePartnerId), 'true')
  }

  async function fetch(): Promise<void> {
    isLoading.value = true
    try {
      const { data, error } = await api.GET('/campaigns', {
        params: {
          query: withPartnerScope({
            'filter[status]': 'sent',
            'sort': '-sent_at',
            'per_page': 1,
          }),
        } as { query: Record<string, unknown> },
      })
      if (error || !data) return
      const raw = data as { data: Record<string, unknown>[] }
      const c = raw.data[0]
      if (!c) return
      lastCampaign.value = {
        id: Number(c.id),
        name: String(c.name ?? ''),
        volume: c.volume_estimated ? Number(c.volume_estimated) : null,
        sentAt: String(c.sent_at),
      }
    }
    catch {
      // silently fail -- banner is non-critical
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    lastCampaign,
    isLoading,
    daysSinceLastSend,
    shouldShow,
    isDismissed,
    dismiss,
    fetch,
  }
}
