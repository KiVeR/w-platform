import { ref, computed } from 'vue'
import type { OperationTransition, LifecycleStatus } from '#operations/types/operations'
import { LIFECYCLE_TRANSITIONS } from '#operations/types/operations'

export function useOperationTransitions() {
  const api = useNuxtApp().$api as { GET: Function; POST: Function }

  const transitions = ref<OperationTransition[]>([])
  const isTransitioning = ref(false)
  const isLoadingHistory = ref(false)
  const hasError = ref(false)

  function allowedTransitions(currentStatus: LifecycleStatus): LifecycleStatus[] {
    return LIFECYCLE_TRANSITIONS[currentStatus] ?? []
  }

  async function applyTransition(
    operationId: number,
    track: string,
    toState: string,
    reason?: string,
  ): Promise<boolean> {
    isTransitioning.value = true
    hasError.value = false
    try {
      const body: Record<string, unknown> = { track, to_state: toState }
      if (reason) {
        body.reason = reason
      }
      const { error } = await api.POST('/operations/{operation}/transition', {
        params: { path: { operation: operationId } },
        body,
      })
      if (error) {
        hasError.value = true
        return false
      }
      return true
    }
    catch {
      hasError.value = true
      return false
    }
    finally {
      isTransitioning.value = false
    }
  }

  async function fetchTransitionHistory(operationId: number): Promise<void> {
    isLoadingHistory.value = true
    try {
      const { data, error } = await api.GET('/operations/{operation}/transitions', {
        params: { path: { operation: operationId } },
      })
      if (error) {
        transitions.value = []
        return
      }
      if (data) {
        const raw = data as { data: Record<string, unknown>[] }
        transitions.value = raw.data.map((t) => ({
          id: Number(t.id),
          operation_id: Number(t.operation_id),
          track: String(t.track ?? ''),
          from_state: String(t.from_state ?? ''),
          to_state: String(t.to_state ?? ''),
          user_id: t.user_id != null ? Number(t.user_id) : null,
          reason: t.reason ? String(t.reason) : null,
          metadata: t.metadata as Record<string, unknown> | null ?? null,
          created_at: String(t.created_at ?? ''),
          user: t.user as OperationTransition['user'] ?? null,
        }))
      }
    }
    catch {
      transitions.value = []
    }
    finally {
      isLoadingHistory.value = false
    }
  }

  return {
    transitions,
    isTransitioning,
    isLoadingHistory,
    hasError,
    allowedTransitions,
    applyTransition,
    fetchTransitionHistory,
  }
}
