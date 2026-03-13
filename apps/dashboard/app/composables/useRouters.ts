import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import type { Router, RouterForm } from '@/types/admin'

type RouterDeleteError = 'in_use' | null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function toNullableString(value: unknown): string | null {
  if (value == null || value === '') {
    return null
  }

  return String(value)
}

function mapRouter(raw: Record<string, unknown>): Router {
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ''),
    external_id: toNullableNumber(raw.external_id),
    num_stop: toNullableString(raw.num_stop),
    is_active: toBoolean(raw.is_active),
    partners_count: Number(raw.partners_count ?? 0),
    campaigns_count: Number(raw.campaigns_count ?? 0),
    created_at: toNullableString(raw.created_at),
    updated_at: toNullableString(raw.updated_at),
  }
}

function buildPayload(form: RouterForm): Record<string, unknown> {
  return {
    name: form.name.trim(),
    external_id: form.external_id,
    num_stop: form.num_stop?.trim() || null,
    is_active: form.is_active,
  }
}

export function useRouters() {
  const api = useApi()

  const routers = ref<Router[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const hasError = ref(false)
  const deleteError = ref<RouterDeleteError>(null)

  function clearDeleteError(): void {
    deleteError.value = null
  }

  async function fetchRouters(): Promise<void> {
    isLoading.value = true
    hasError.value = false

    try {
      const { data, error } = await api.GET('/routers' as never, {
        params: {
          query: {
            sort: 'name',
          },
        },
      } as never)

      if (error) {
        hasError.value = true
        return
      }

      const raw = data as { data?: Record<string, unknown>[] } | undefined
      routers.value = Array.isArray(raw?.data)
        ? raw.data.filter(isRecord).map(mapRouter)
        : []
    }
    catch {
      hasError.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  async function createRouter(form: RouterForm): Promise<boolean> {
    isSaving.value = true
    hasError.value = false
    clearDeleteError()

    try {
      const { data, error } = await api.POST('/routers' as never, {
        body: buildPayload(form) as never,
      } as never)

      if (error) {
        hasError.value = true
        return false
      }

      const raw = data as { data?: Record<string, unknown> } | undefined
      if (raw?.data && isRecord(raw.data)) {
        routers.value = [...routers.value, mapRouter(raw.data)].sort((a, b) => a.name.localeCompare(b.name))
      }

      return true
    }
    catch {
      hasError.value = true
      return false
    }
    finally {
      isSaving.value = false
    }
  }

  async function updateRouter(id: number, form: RouterForm): Promise<boolean> {
    isSaving.value = true
    hasError.value = false
    clearDeleteError()

    try {
      const { data, error } = await api.PUT('/routers/{router}' as never, {
        params: {
          path: { router: id },
        },
        body: buildPayload(form) as never,
      } as never)

      if (error) {
        hasError.value = true
        return false
      }

      const raw = data as { data?: Record<string, unknown> } | undefined
      if (raw?.data && isRecord(raw.data)) {
        const next = mapRouter(raw.data)
        routers.value = routers.value
          .map(router => router.id === id ? next : router)
          .sort((a, b) => a.name.localeCompare(b.name))
      }

      return true
    }
    catch {
      hasError.value = true
      return false
    }
    finally {
      isSaving.value = false
    }
  }

  async function deleteRouter(id: number): Promise<boolean> {
    isSaving.value = true
    hasError.value = false
    clearDeleteError()

    try {
      const { error, response } = await api.DELETE('/routers/{router}' as never, {
        params: {
          path: { router: id },
        },
      } as never)

      if (error) {
        if ((response as Response | undefined)?.status === 409) {
          deleteError.value = 'in_use'
          return false
        }

        hasError.value = true
        return false
      }

      routers.value = routers.value.filter(router => router.id !== id)
      return true
    }
    catch {
      hasError.value = true
      return false
    }
    finally {
      isSaving.value = false
    }
  }

  return {
    routers,
    isLoading,
    isSaving,
    hasError,
    deleteError,
    fetchRouters,
    createRouter,
    updateRouter,
    deleteRouter,
    clearDeleteError,
  }
}
