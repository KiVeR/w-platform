import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import type { HubStats, PartnerAlert } from '@/types/hub'

const LOW_CREDITS_THRESHOLD = 200

interface PartnerRow {
  id: number
  name: string
  is_active: boolean
  euro_credits: string
}

export function useHubDashboard() {
  const api = useApi()

  const stats = ref<HubStats | null>(null)
  const alerts = ref<PartnerAlert[]>([])
  const isLoading = ref(false)
  const hasError = ref(false)

  async function fetchDashboard(): Promise<void> {
    isLoading.value = true
    hasError.value = false

    try {
      const [partnersRes, demandesRes] = await Promise.all([
        api.GET('/partners', {
          params: { query: { per_page: 100 } } as { query: Record<string, unknown> },
        }),
        api.GET('/demandes', {
          params: { query: { per_page: 1 } } as { query: Record<string, unknown> },
        }),
      ])

      if (partnersRes.error || !partnersRes.data) {
        throw new Error('hub_fetch_failed')
      }

      const partnersPayload = partnersRes.data as {
        data: Record<string, unknown>[]
        meta: Record<string, unknown>
      }

      const partners: PartnerRow[] = partnersPayload.data.map(raw => ({
        id: Number(raw.id),
        name: String(raw.name ?? ''),
        is_active: raw.is_active === true || raw.is_active === 'true' || raw.is_active === 1,
        euro_credits: String(raw.euro_credits ?? '0'),
      }))

      const activePartners = partners.filter(p => p.is_active)

      let totalDemandes = 0
      if (!demandesRes.error && demandesRes.data) {
        const demandesPayload = demandesRes.data as { meta: Record<string, unknown> }
        totalDemandes = Number(demandesPayload.meta?.total ?? 0)
      }

      stats.value = {
        partnersCount: partners.length,
        activePartnersCount: activePartners.length,
        totalCredits: partners.reduce((sum, p) => sum + parseFloat(p.euro_credits), 0),
        totalDemandes,
      }

      const detectedAlerts: PartnerAlert[] = []

      for (const partner of partners) {
        const credits = parseFloat(partner.euro_credits)
        if (credits < LOW_CREDITS_THRESHOLD) {
          detectedAlerts.push({
            partnerId: partner.id,
            partnerName: partner.name,
            type: 'low-credits',
            message: `${credits.toFixed(2)} EUR`,
          })
        }
      }

      alerts.value = detectedAlerts
    }
    catch {
      hasError.value = true
      stats.value = null
      alerts.value = []
    }
    finally {
      isLoading.value = false
    }
  }

  return { stats, alerts, isLoading, hasError, fetchDashboard }
}
