import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { usePartnerScope } from '@/composables/usePartnerScope'
import type { operations } from '@/types/api'
import type { CampaignFilters, CampaignPagination, CampaignRow, CampaignStatus, CampaignType } from '@/types/campaign'

type CampaignsIndexQuery = NonNullable<operations['campaigns.index']['parameters']['query']>

export function useCampaigns() {
  const api = useApi()
  const { withPartnerScope } = usePartnerScope()

  const campaigns = ref<CampaignRow[]>([])
  const pagination = ref<CampaignPagination>({ page: 1, lastPage: 1, total: 0 })
  const isLoading = ref(false)
  const hasError = ref(false)
  const filters = ref<CampaignFilters>({ search: '', statuses: [], type: '', dateFrom: '', dateTo: '' })
  const sort = ref('-created_at')

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

  async function fetchCampaigns(): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      const query = withPartnerScope({
        sort: sort.value,
        page: pagination.value.page,
        'filter[status][]': filters.value.statuses.length > 0 ? filters.value.statuses : undefined,
        'filter[type]': filters.value.type || undefined,
        'filter[name]': filters.value.search || undefined,
        'filter[created_at_from]': filters.value.dateFrom || undefined,
        'filter[created_at_to]': filters.value.dateTo || undefined,
      }) as CampaignsIndexQuery

      const { data, error } = await api.GET('/campaigns', {
        params: {
          query,
        },
      })
      if (error) {
        hasError.value = true
        return
      }
      if (data) {
        const raw = data as { data: Record<string, unknown>[], meta: Record<string, unknown> }
        campaigns.value = raw.data.map(mapCampaign)
        pagination.value = {
          page: Number(raw.meta.current_page),
          lastPage: Number(raw.meta.last_page),
          total: Number(raw.meta.total),
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

  async function deleteCampaign(id: number): Promise<boolean> {
    const { error } = await api.DELETE('/campaigns/{campaign}', {
      params: { path: { campaign: id } },
    } as never)
    return !error
  }

  async function setPage(page: number): Promise<void> {
    pagination.value.page = page
    await fetchCampaigns()
  }

  async function setSort(field: string): Promise<void> {
    const currentField = sort.value.replace(/^-/, '')
    if (currentField === field) {
      sort.value = sort.value.startsWith('-') ? field : `-${field}`
    }
    else {
      sort.value = `-${field}`
    }
    await fetchCampaigns()
  }

  function setFilters(f: Partial<CampaignFilters>): void {
    Object.assign(filters.value, f)
    pagination.value.page = 1
  }

  return {
    campaigns,
    pagination,
    isLoading,
    hasError,
    filters,
    sort,
    fetchCampaigns,
    deleteCampaign,
    setPage,
    setSort,
    setFilters,
  }
}
