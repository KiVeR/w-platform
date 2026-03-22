import { ref } from 'vue'
import type { OperationRow, OperationFilters, OperationPagination, OperationType, LifecycleStatus } from '#operations/types/operations'

export function useOperations() {
  const api = useNuxtApp().$api as { GET: Function }

  const operations = ref<OperationRow[]>([])
  const pagination = ref<OperationPagination>({ page: 1, lastPage: 1, total: 0 })
  const isLoading = ref(false)
  const hasError = ref(false)
  const filters = ref<OperationFilters>({})
  const sort = ref('-created_at')

  function mapOperation(raw: Record<string, unknown>): OperationRow {
    return {
      id: Number(raw.id),
      demande_id: Number(raw.demande_id),
      ref_operation: String(raw.ref_operation ?? ''),
      line_number: Number(raw.line_number ?? 0),
      type: String(raw.type ?? 'loc') as OperationType,
      name: String(raw.name ?? ''),
      advertiser: raw.advertiser ? String(raw.advertiser) : null,
      priority: raw.priority ? String(raw.priority) as OperationRow['priority'] : null,
      lifecycle_status: String(raw.lifecycle_status ?? 'draft') as LifecycleStatus,
      creative_status: String(raw.creative_status ?? 'not_applicable') as OperationRow['creative_status'],
      billing_status: String(raw.billing_status ?? 'not_applicable') as OperationRow['billing_status'],
      routing_status: String(raw.routing_status ?? 'not_applicable') as OperationRow['routing_status'],
      volume_estimated: raw.volume_estimated != null ? Number(raw.volume_estimated) : null,
      volume_sent: raw.volume_sent != null ? Number(raw.volume_sent) : null,
      unit_price: raw.unit_price != null ? Number(raw.unit_price) : null,
      total_price: raw.total_price != null ? Number(raw.total_price) : null,
      assigned_to: raw.assigned_to != null ? Number(raw.assigned_to) : null,
      scheduled_at: raw.scheduled_at ? String(raw.scheduled_at) : null,
      delivered_at: raw.delivered_at ? String(raw.delivered_at) : null,
      created_at: String(raw.created_at ?? ''),
    }
  }

  async function fetchOperations(): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      const query: Record<string, unknown> = {
        sort: sort.value,
        page: pagination.value.page,
      }
      if (filters.value.lifecycle_status) {
        query['filter[lifecycle_status]'] = filters.value.lifecycle_status
      }
      if (filters.value.type) {
        query['filter[type]'] = filters.value.type
      }
      if (filters.value.assigned_to) {
        query['filter[assigned_to]'] = filters.value.assigned_to
      }
      if (filters.value.demande_id) {
        query['filter[demande_id]'] = filters.value.demande_id
      }
      if (filters.value.search) {
        query['filter[name]'] = filters.value.search
      }

      const { data, error } = await api.GET('/operations', {
        params: { query },
      })
      if (error) {
        hasError.value = true
        return
      }
      if (data) {
        const raw = data as { data: Record<string, unknown>[]; meta: Record<string, unknown> }
        operations.value = raw.data.map(mapOperation)
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

  async function setPage(page: number): Promise<void> {
    pagination.value.page = page
    await fetchOperations()
  }

  async function setSort(field: string): Promise<void> {
    const currentField = sort.value.replace(/^-/, '')
    if (currentField === field) {
      sort.value = sort.value.startsWith('-') ? field : `-${field}`
    }
    else {
      sort.value = `-${field}`
    }
    await fetchOperations()
  }

  function setFilters(f: Partial<OperationFilters>): void {
    Object.assign(filters.value, f)
    pagination.value.page = 1
  }

  return {
    operations,
    pagination,
    isLoading,
    hasError,
    filters,
    sort,
    fetchOperations,
    setPage,
    setSort,
    setFilters,
  }
}
