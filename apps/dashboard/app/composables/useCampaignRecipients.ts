import { ref, type MaybeRefOrGetter, toValue } from 'vue'
import { useApi } from '@/composables/useApi'
import type { CampaignRecipientRow, CampaignRecipientStatus, RecipientFilters, RecipientPagination } from '@/types/campaign'

function optionalString(value: unknown): string | null {
  return value ? String(value) : null
}

function optionalNumber(value: unknown): number | null {
  return value ? Number(value) : null
}

function mapRecipient(raw: Record<string, unknown>): CampaignRecipientRow {
  return {
    id: Number(raw.id),
    campaign_id: Number(raw.campaign_id),
    status: String(raw.status ?? 'QUEUED') as CampaignRecipientStatus,
    phone_number: String(raw.phone_number ?? ''),
    message_preview: optionalString(raw.message_preview),
    message_preview_length: optionalNumber(raw.message_preview_length),
    short_url_suffix: optionalString(raw.short_url_suffix),
    short_url_slug: optionalString(raw.short_url_slug),
    short_url_click: Number(raw.short_url_click ?? 0),
    additional_information: raw.additional_information as Record<string, unknown> | null ?? null,
    stop_requested_at: optionalString(raw.stop_requested_at),
    delivered_at: optionalString(raw.delivered_at),
  }
}

export function useCampaignRecipients(campaignId: MaybeRefOrGetter<number>) {
  const api = useApi()

  const recipients = ref<CampaignRecipientRow[]>([])
  const pagination = ref<RecipientPagination>({ page: 1, lastPage: 1, total: 0, perPage: 15 })
  const isLoading = ref(false)
  const hasError = ref(false)
  const filters = ref<RecipientFilters>({ search: '', statuses: [] })
  const sort = ref('-delivered_at')

  async function fetchRecipients(): Promise<void> {
    isLoading.value = true
    hasError.value = false

    try {
      const { data, error } = await api.GET('/campaigns/{campaign}/recipients' as never, {
        params: {
          path: { campaign: toValue(campaignId) },
          query: {
            sort: sort.value,
            page: pagination.value.page,
            per_page: pagination.value.perPage,
            'filter[status]': filters.value.statuses.join(',') || undefined,
            'filter[phone_number]': filters.value.search || undefined,
          },
        },
      } as never)

      if (error) {
        hasError.value = true
        return
      }

      if (data) {
        const raw = data as { data: Record<string, unknown>[], meta: Record<string, unknown> }
        recipients.value = raw.data.map(mapRecipient)
        pagination.value = {
          page: Number(raw.meta.current_page),
          lastPage: Number(raw.meta.last_page),
          total: Number(raw.meta.total),
          perPage: Number(raw.meta.per_page ?? 15),
        }
      }
    }
    catch {
      hasError.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  async function setPage(page: number): Promise<void> {
    pagination.value.page = page
    await fetchRecipients()
  }

  async function setPerPage(perPage: number): Promise<void> {
    pagination.value.page = 1
    pagination.value.perPage = perPage
    await fetchRecipients()
  }

  async function setSort(field: string): Promise<void> {
    const currentField = sort.value.replace(/^-/, '')
    if (currentField === field) {
      sort.value = sort.value.startsWith('-') ? field : `-${field}`
    }
    else {
      sort.value = `-${field}`
    }

    await fetchRecipients()
  }

  function setFilters(next: Partial<RecipientFilters>): void {
    Object.assign(filters.value, next)
    pagination.value.page = 1
  }

  return {
    recipients,
    pagination,
    isLoading,
    hasError,
    filters,
    sort,
    fetchRecipients,
    setPage,
    setPerPage,
    setSort,
    setFilters,
  }
}
