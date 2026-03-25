import { ref } from 'vue'
import type { DemandeRow, DemandeFilters, DemandePagination, DemandeOperationRow } from '#demandes/types/demandes'

export function useDemandes() {
  const { $api } = useNuxtApp()
  // usePartnerScope est auto-importé par Nuxt depuis l'app dashboard
  const { withPartnerScope } = usePartnerScope()

  const demandes = ref<DemandeRow[]>([])
  const pagination = ref<DemandePagination>({ page: 1, lastPage: 1, total: 0 })
  const isLoading = ref(false)
  const hasError = ref(false)
  const filters = ref<DemandeFilters>({})
  const sort = ref('-created_at')

  function mapOperation(raw: Record<string, unknown>): DemandeOperationRow {
    return {
      id: Number(raw.id),
      ref_operation: String(raw.ref_operation ?? ''),
      line_number: Number(raw.line_number ?? 0),
      type: String(raw.type ?? ''),
      name: String(raw.name ?? ''),
      advertiser: raw.advertiser ? String(raw.advertiser) : null,
      priority: raw.priority ? String(raw.priority) : null,
      lifecycle_status: String(raw.lifecycle_status ?? ''),
      last_transitioned_at: raw.last_transitioned_at ? String(raw.last_transitioned_at) : null,
      created_at: String(raw.created_at ?? ''),
    }
  }

  function mapDemande(raw: Record<string, unknown>): DemandeRow {
    const partnerRaw = raw.partner as Record<string, unknown> | null | undefined
    const operationsRaw = raw.operations as Record<string, unknown>[] | null | undefined

    return {
      id: Number(raw.id),
      ref_demande: String(raw.ref_demande ?? ''),
      ref_client: raw.ref_client ? String(raw.ref_client) : null,
      information: raw.information ? String(raw.information) : null,
      is_exoneration: raw.is_exoneration === true || raw.is_exoneration === 'true',
      pays_id: raw.pays_id ? String(raw.pays_id) : null,
      partner_id: Number(raw.partner_id),
      commercial_id: raw.commercial_id ? Number(raw.commercial_id) : null,
      sdr_id: raw.sdr_id ? Number(raw.sdr_id) : null,
      operations_count: Number(raw.operations_count ?? 0),
      operations_completed_count: Number(raw.operations_completed_count ?? 0),
      operations_blocked_count: Number(raw.operations_blocked_count ?? 0),
      created_at: String(raw.created_at ?? ''),
      updated_at: String(raw.updated_at ?? ''),
      partner: partnerRaw
        ? { id: Number(partnerRaw.id), name: String(partnerRaw.name ?? '') }
        : undefined,
      operations: operationsRaw
        ? operationsRaw.map(mapOperation)
        : undefined,
    }
  }

  async function fetchDemandes(): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      const f = filters.value
      const query = withPartnerScope({
        include: 'partner',
        sort: sort.value,
        page: pagination.value.page,
        'filter[partner_id]': f.partner_id ?? undefined,
        'filter[ref_demande]': f.ref_demande || undefined,
        'filter[is_exoneration]': f.is_exoneration !== undefined ? f.is_exoneration : undefined,
        'filter[created_at_from]': f.created_at_from || undefined,
        'filter[created_at_to]': f.created_at_to || undefined,
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await ($api as any).GET('/demandes', {
        params: { query },
      })

      if (error) { hasError.value = true; return }
      if (data) {
        const raw = data as { data: Record<string, unknown>[], meta: Record<string, unknown> }
        demandes.value = raw.data.map(mapDemande)
        pagination.value = {
          page: Number(raw.meta.current_page),
          lastPage: Number(raw.meta.last_page),
          total: Number(raw.meta.total),
        }
      }
    }
    catch { hasError.value = true }
    finally { isLoading.value = false }
  }

  async function setPage(page: number): Promise<void> {
    pagination.value.page = page
    await fetchDemandes()
  }

  async function setSort(field: string): Promise<void> {
    const currentField = sort.value.replace(/^-/, '')
    if (currentField === field) {
      sort.value = sort.value.startsWith('-') ? field : `-${field}`
    }
    else {
      sort.value = `-${field}`
    }
    await fetchDemandes()
  }

  function setFilters(f: Partial<DemandeFilters>): void {
    Object.assign(filters.value, f)
    pagination.value.page = 1
  }

  return {
    demandes,
    pagination,
    isLoading,
    hasError,
    filters,
    sort,
    fetchDemandes,
    setPage,
    setSort,
    setFilters,
  }
}
