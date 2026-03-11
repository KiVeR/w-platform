import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { usePartnerScope } from '@/composables/usePartnerScope'
import type { CampaignRow, CampaignStatus, CampaignType } from '@/types/campaign'

export type DashboardPeriod = '7d' | '30d' | '90d'

export interface DashboardStatsSummary {
  activeCount: number
  scheduledCount: number
  errorCount: number
  totalVolume: number
}

export interface DashboardSeries {
  labels: string[]
  values: number[]
}

const PERIOD_DAYS: Record<DashboardPeriod, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

function mapCampaign(raw: Record<string, unknown>): CampaignRow {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    type: String(raw.type ?? 'prospection') as CampaignType,
    status: String(raw.status ?? 'draft') as CampaignStatus,
    is_demo: raw.is_demo === 'true' || raw.is_demo === true,
    volume_estimated: raw.volume_estimated ? Number(raw.volume_estimated) : null,
    scheduled_at: raw.scheduled_at ? String(raw.scheduled_at) : null,
    sent_at: raw.sent_at ? String(raw.sent_at) : null,
    created_at: String(raw.created_at ?? ''),
  }
}

function toUtcDayKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toISOString().slice(0, 10)
}

function formatDayLabel(dayKey: string): string {
  const [, month, day] = dayKey.split('-')
  return `${day}/${month}`
}

function resolveRange(period: DashboardPeriod, now: Date) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - PERIOD_DAYS[period] + 1)
  return { start, end }
}

function buildDayKeys(start: Date, end: Date): string[] {
  const keys: string[] = []
  const cursor = new Date(start)

  while (cursor <= end) {
    keys.push(toUtcDayKey(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return keys
}

export function useDashboardStats() {
  const api = useApi()
  const { withPartnerScope } = usePartnerScope()

  const period = ref<DashboardPeriod>('30d')
  const stats = ref<DashboardStatsSummary | null>(null)
  const volumeData = ref<DashboardSeries | null>(null)
  const activityData = ref<DashboardSeries | null>(null)
  const recentCampaigns = ref<CampaignRow[]>([])
  const isLoading = ref(false)
  const isRecentLoading = ref(false)
  const hasError = ref(false)

  async function fetchCampaignPage(page: number) {
    const { data, error } = await api.GET('/campaigns', {
      params: {
        query: withPartnerScope({
          sort: '-created_at',
          page,
        }),
      } as { query: Record<string, unknown> },
    })

    if (error || !data) {
      throw new Error('dashboard_fetch_failed')
    }

    const payload = data as {
      data: Record<string, unknown>[]
      meta: Record<string, unknown>
    }

    return {
      campaigns: payload.data.map(mapCampaign),
      lastPage: Number(payload.meta.last_page ?? 1),
    }
  }

  async function fetchStats(): Promise<void> {
    isLoading.value = true
    hasError.value = false

    try {
      const range = resolveRange(period.value, new Date())
      const startKey = toUtcDayKey(range.start)
      const endKey = toUtcDayKey(range.end)
      const dayKeys = buildDayKeys(range.start, range.end)
      const volumeBuckets = new Map(dayKeys.map(key => [key, 0]))
      const activityBuckets = new Map(dayKeys.map(key => [key, 0]))

      let page = 1
      let lastPage = 1
      const campaigns: CampaignRow[] = []

      do {
        const response = await fetchCampaignPage(page)
        campaigns.push(...response.campaigns)
        lastPage = response.lastPage

        const oldestCampaign = response.campaigns.at(-1)
        if (!oldestCampaign) break
        if (toUtcDayKey(oldestCampaign.created_at) < startKey) break

        page += 1
      } while (page <= lastPage)

      const windowCampaigns = campaigns.filter((campaign) => {
        const key = toUtcDayKey(campaign.created_at)
        return key >= startKey && key <= endKey
      })

      for (const campaign of windowCampaigns) {
        const key = toUtcDayKey(campaign.created_at)
        activityBuckets.set(key, (activityBuckets.get(key) ?? 0) + 1)
        volumeBuckets.set(key, (volumeBuckets.get(key) ?? 0) + (campaign.volume_estimated ?? 0))
      }

      stats.value = {
        activeCount: windowCampaigns.filter(campaign => ['sending', 'sent'].includes(campaign.status)).length,
        scheduledCount: windowCampaigns.filter(campaign => campaign.status === 'scheduled').length,
        errorCount: windowCampaigns.filter(campaign => campaign.status === 'failed').length,
        totalVolume: windowCampaigns.reduce((total, campaign) => total + (campaign.volume_estimated ?? 0), 0),
      }

      volumeData.value = {
        labels: dayKeys.map(formatDayLabel),
        values: dayKeys.map(key => volumeBuckets.get(key) ?? 0),
      }

      activityData.value = {
        labels: dayKeys.map(formatDayLabel),
        values: dayKeys.map(key => activityBuckets.get(key) ?? 0),
      }
    }
    catch {
      hasError.value = true
      stats.value = null
      volumeData.value = null
      activityData.value = null
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchRecentCampaigns(): Promise<void> {
    isRecentLoading.value = true
    hasError.value = false

    try {
      const { campaigns } = await fetchCampaignPage(1)
      recentCampaigns.value = campaigns.slice(0, 5)
    }
    catch {
      hasError.value = true
      recentCampaigns.value = []
    }
    finally {
      isRecentLoading.value = false
    }
  }

  async function refreshDashboard(): Promise<void> {
    await Promise.all([
      fetchStats(),
      fetchRecentCampaigns(),
    ])
  }

  async function setPeriod(nextPeriod: DashboardPeriod): Promise<void> {
    if (period.value === nextPeriod) return
    period.value = nextPeriod
    await fetchStats()
  }

  return {
    stats,
    volumeData,
    activityData,
    recentCampaigns,
    period,
    isLoading,
    isRecentLoading,
    hasError,
    fetchStats,
    fetchRecentCampaigns,
    refreshDashboard,
    setPeriod,
  }
}
