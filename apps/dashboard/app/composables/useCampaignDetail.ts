import { ref, type MaybeRef, toValue } from 'vue'
import { useApi } from '@/composables/useApi'
import type {
  CampaignChannel,
  CampaignDetailEnriched,
  CampaignRoutingStatus,
  CampaignStatus,
  CampaignType,
} from '@/types/campaign'

function optionalString(value: unknown): string | null {
  return value ? String(value) : null
}

function optionalNumber(value: unknown): number | null {
  return value ? Number(value) : null
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function mapCampaign(raw: Record<string, unknown>): CampaignDetailEnriched {
  return {
    id: Number(raw.id),
    partner_id: Number(raw.partner_id),
    user_id: Number(raw.user_id),
    type: String(raw.type ?? 'prospection') as CampaignType,
    channel: String(raw.channel ?? 'sms') as CampaignChannel,
    status: String(raw.status ?? 'draft') as CampaignStatus,
    is_demo: raw.is_demo === 'true' || raw.is_demo === true,
    name: String(raw.name ?? ''),
    targeting: optionalString(raw.targeting),
    volume_estimated: optionalNumber(raw.volume_estimated),
    volume_sent: optionalNumber(raw.volume_sent),
    message: optionalString(raw.message),
    sender: optionalString(raw.sender),
    additional_phone: optionalString(raw.additional_phone),
    sms_count: Number(raw.sms_count ?? 1),
    short_url: optionalString(raw.short_url),
    scheduled_at: optionalString(raw.scheduled_at),
    sent_at: optionalString(raw.sent_at),
    unit_price: optionalString(raw.unit_price),
    total_price: optionalString(raw.total_price),
    created_at: String(raw.created_at ?? ''),
    partner: raw.partner ? raw.partner as CampaignDetailEnriched['partner'] : null,
    creator: raw.creator ? raw.creator as CampaignDetailEnriched['creator'] : null,
    routing_status: (raw.routing_status as CampaignRoutingStatus | undefined) ?? null,
    router_id: optionalNumber(raw.router_id),
    variable_schema_id: optionalNumber(raw.variable_schema_id),
    routing_at: optionalString(raw.routing_at),
    routing_executed_at: optionalString(raw.routing_executed_at),
    recipients_count: optionalNumber(raw.recipients_count),
    router: raw.router ? raw.router as CampaignDetailEnriched['router'] : null,
  }
}

export function useCampaignDetail(id: MaybeRef<number>) {
  const api = useApi()

  const campaign = ref<CampaignDetailEnriched | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isExporting = ref(false)

  async function fetchCampaign(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const { data: resp, error: apiError } = await api.GET('/campaigns/{campaign}', {
        params: {
          path: { campaign: toValue(id) },
          query: { include: 'partner,creator,router' },
        },
      } as never)
      if (apiError) {
        error.value = 'load_error'
        return
      }
      if (resp) {
        const raw = (resp as { data: Record<string, unknown> }).data
        campaign.value = mapCampaign(raw)
      }
    }
    catch {
      error.value = 'load_error'
    }
    finally {
      isLoading.value = false
    }
  }

  async function exportCampaign(): Promise<void> {
    isExporting.value = true
    try {
      const { data: resp, error: apiError } = await api.GET('/campaigns/{campaign}/export' as never, {
        params: { path: { campaign: toValue(id) } },
        parseAs: 'blob',
      } as never)
      if (apiError || !resp) return

      const blob = isBlob(resp) ? resp : new Blob([resp as BlobPart], { type: 'text/csv' })
      downloadBlob(blob, `campagne-${toValue(id)}-export.csv`)
    }
    catch {
      // silently fail export
    }
    finally {
      isExporting.value = false
    }
  }

  return {
    campaign,
    isLoading,
    error,
    isExporting,
    fetchCampaign,
    exportCampaign,
  }
}
