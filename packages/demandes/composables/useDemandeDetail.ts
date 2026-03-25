import { ref, watch, type Ref } from 'vue'
import type { DemandeDetail, DemandeOperationRow } from '#demandes/types/demandes'

export function useDemandeDetail(demandeId: Ref<number | null>) {
  const { $api } = useNuxtApp()

  const demande = ref<DemandeDetail | null>(null)
  const isLoading = ref(false)
  const hasError = ref(false)

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

  async function fetchDemande(): Promise<void> {
    if (demandeId.value === null) return
    isLoading.value = true
    hasError.value = false
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await ($api as any).GET('/demandes/{id}', {
        params: {
          path: { id: demandeId.value },
          query: { include: 'partner,commercial,sdr,operations' },
        },
      })

      if (error) { hasError.value = true; return }
      if (data) {
        const raw = (data as { data: Record<string, unknown> }).data as Record<string, unknown>

        const partnerRaw = raw.partner as Record<string, unknown> | null | undefined
        const commercialRaw = raw.commercial as Record<string, unknown> | null | undefined
        const sdrRaw = raw.sdr as Record<string, unknown> | null | undefined
        const operationsRaw = raw.operations as Record<string, unknown>[] | null | undefined

        demande.value = {
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
          commercial: commercialRaw
            ? { id: Number(commercialRaw.id), full_name: String(commercialRaw.full_name ?? '') }
            : null,
          sdr: sdrRaw
            ? { id: Number(sdrRaw.id), full_name: String(sdrRaw.full_name ?? '') }
            : null,
          operations: operationsRaw
            ? operationsRaw.map(mapOperation)
            : undefined,
        }
      }
    }
    catch { hasError.value = true }
    finally { isLoading.value = false }
  }

  function refreshDemande(): Promise<void> {
    return fetchDemande()
  }

  watch(demandeId, fetchDemande, { immediate: true })

  return {
    demande,
    isLoading,
    hasError,
    refreshDemande,
  }
}
