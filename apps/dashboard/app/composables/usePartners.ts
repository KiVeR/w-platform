import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import type { PartnerFilters, PartnerPagination, PartnerRow } from '@/types/partner'

export function usePartners() {
  const api = useApi()

  const partners = ref<PartnerRow[]>([])
  const pagination = ref<PartnerPagination>({ page: 1, lastPage: 1, total: 0 })
  const isLoading = ref(false)
  const hasError = ref(false)
  const filters = ref<PartnerFilters>({ name: '', is_active: null })
  const sort = ref('-created_at')
  const perPage = ref(15)

  function mapPartner(raw: Record<string, unknown>): PartnerRow {
    return {
      id: Number(raw.id),
      name: String(raw.name ?? ''),
      code: raw.code != null ? String(raw.code) : null,
      activity_type: raw.activity_type != null ? String(raw.activity_type) : null,
      email: raw.email != null ? String(raw.email) : null,
      euro_credits: parseFloat(String(raw.euro_credits ?? '0')),
      is_active: raw.is_active === true || raw.is_active === 'true' || raw.is_active === 1,
      users_count: Number(raw.users_count ?? 0),
      shops_count: Number(raw.shops_count ?? 0),
      created_at: String(raw.created_at ?? ''),
    }
  }

  async function fetchPartners(): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      const query: Record<string, unknown> = {
        sort: sort.value,
        page: pagination.value.page,
        per_page: perPage.value,
      }

      if (filters.value.name) {
        query['filter[name]'] = filters.value.name
      }
      if (filters.value.is_active !== null && filters.value.is_active !== undefined) {
        query['filter[is_active]'] = filters.value.is_active ? 1 : 0
      }
      if (filters.value.adv_id) {
        query['filter[adv_id]'] = filters.value.adv_id
      }

      const { data, error } = await api.GET('/partners', {
        params: { query } as { query: Record<string, unknown> },
      })

      if (error) {
        hasError.value = true
        return
      }

      if (data) {
        const raw = data as { data: Record<string, unknown>[], meta: Record<string, unknown> }
        partners.value = raw.data.map(mapPartner)
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

  async function deletePartner(id: number): Promise<boolean> {
    const { error } = await api.DELETE('/partners/{partner}', {
      params: { path: { partner: id } },
    } as never)
    return !error
  }

  async function setPage(page: number): Promise<void> {
    pagination.value.page = page
    await fetchPartners()
  }

  async function setSort(field: string): Promise<void> {
    const currentField = sort.value.replace(/^-/, '')
    if (currentField === field) {
      sort.value = sort.value.startsWith('-') ? field : `-${field}`
    }
    else {
      sort.value = `-${field}`
    }
    await fetchPartners()
  }

  function setFilters(f: Partial<PartnerFilters>): void {
    Object.assign(filters.value, f)
    pagination.value.page = 1
  }

  return {
    partners,
    pagination,
    isLoading,
    hasError,
    filters,
    sort,
    perPage,
    fetchPartners,
    deletePartner,
    setPage,
    setSort,
    setFilters,
  }
}
