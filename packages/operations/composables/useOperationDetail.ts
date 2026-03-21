import { ref } from 'vue'
import type { OperationDetail, OperationType, LifecycleStatus } from '#operations/types/operations'

export function useOperationDetail() {
  const api = useNuxtApp().$api as { GET: Function }

  const operation = ref<OperationDetail | null>(null)
  const isLoading = ref(false)
  const hasError = ref(false)

  function mapDetail(raw: Record<string, unknown>): OperationDetail {
    return {
      id: Number(raw.id),
      demande_id: Number(raw.demande_id),
      ref_operation: String(raw.ref_operation ?? ''),
      line_number: Number(raw.line_number ?? 0),
      type: String(raw.type ?? 'loc') as OperationType,
      name: String(raw.name ?? ''),
      advertiser: raw.advertiser ? String(raw.advertiser) : null,
      priority: raw.priority ? String(raw.priority) as OperationDetail['priority'] : null,
      lifecycle_status: String(raw.lifecycle_status ?? 'draft') as LifecycleStatus,
      creative_status: String(raw.creative_status ?? 'not_applicable') as OperationDetail['creative_status'],
      billing_status: String(raw.billing_status ?? 'not_applicable') as OperationDetail['billing_status'],
      routing_status: String(raw.routing_status ?? 'not_applicable') as OperationDetail['routing_status'],
      volume_estimated: raw.volume_estimated != null ? Number(raw.volume_estimated) : null,
      volume_sent: raw.volume_sent != null ? Number(raw.volume_sent) : null,
      unit_price: raw.unit_price != null ? Number(raw.unit_price) : null,
      total_price: raw.total_price != null ? Number(raw.total_price) : null,
      assigned_to: raw.assigned_to != null ? Number(raw.assigned_to) : null,
      scheduled_at: raw.scheduled_at ? String(raw.scheduled_at) : null,
      delivered_at: raw.delivered_at ? String(raw.delivered_at) : null,
      created_at: String(raw.created_at ?? ''),
      hold_reason: raw.hold_reason ? String(raw.hold_reason) : null,
      preparation_step: raw.preparation_step ? String(raw.preparation_step) : null,
      processing_status: raw.processing_status ? String(raw.processing_status) : null,
      cancellation_type: raw.cancellation_type ? String(raw.cancellation_type) : null,
      targeting: raw.targeting as Record<string, unknown> | null ?? null,
      message: raw.message ? String(raw.message) : null,
      sender: raw.sender ? String(raw.sender) : null,
      external_ref: raw.external_ref ? String(raw.external_ref) : null,
      demande: raw.demande as OperationDetail['demande'],
      campaign: raw.campaign as OperationDetail['campaign'] ?? null,
      assigned_user: raw.assigned_user as OperationDetail['assigned_user'] ?? null,
    }
  }

  async function fetchOperation(id: number): Promise<void> {
    isLoading.value = true
    hasError.value = false
    try {
      const { data, error } = await api.GET('/operations/{operation}', {
        params: {
          path: { operation: id },
          query: { include: 'demande,demande.partner,campaign,assignedUser' },
        },
      })
      if (error) {
        hasError.value = true
        return
      }
      if (data) {
        const raw = data as { data: Record<string, unknown> }
        operation.value = mapDetail(raw.data)
      }
    }
    catch {
      hasError.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  async function refreshOperation(): Promise<void> {
    if (operation.value) {
      await fetchOperation(operation.value.id)
    }
  }

  return {
    operation,
    isLoading,
    hasError,
    fetchOperation,
    refreshOperation,
  }
}
