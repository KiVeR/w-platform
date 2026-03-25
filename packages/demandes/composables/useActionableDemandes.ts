import { ref } from 'vue'
import type { DemandeRow, DemandeOperationRow } from '#demandes/types/demandes'

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

export function useActionableDemandes() {
  const { $api } = useNuxtApp()
  const { withPartnerScope } = usePartnerScope()

  const demandes = ref<DemandeRow[]>([])
  const isLoading = ref(false)
  const hasError = ref(false)

  async function fetchActionableDemandes(): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await ($api as any).GET('/demandes', {
        params: {
          query: withPartnerScope({
            include: 'operations',
            sort: '-created_at',
            'page[size]': 50,
          }),
        },
      })
      if (error) { hasError.value = true; return }
      if (data) {
        const raw = data as { data: Record<string, unknown>[] }
        demandes.value = raw.data.map(mapDemande)
      }
    }
    catch { hasError.value = true }
    finally { isLoading.value = false }
  }

  return { demandes, isLoading, hasError, fetchActionableDemandes }
}
