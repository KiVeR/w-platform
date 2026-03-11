import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { usePartnerScope } from '@/composables/usePartnerScope'
import { usePartnerStore } from '@/stores/partner'
import { useAuthStore } from '@/stores/auth'
import type { VariableField, VariableFieldForm, VariableSchema, VariableSchemaForm } from '@/types/admin'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function mapField(raw: Record<string, unknown>): VariableField {
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ''),
    is_used: toBoolean(raw.is_used),
    is_global: toBoolean(raw.is_global),
    created_at: raw.created_at ? String(raw.created_at) : null,
    updated_at: raw.updated_at ? String(raw.updated_at) : null,
  }
}

function mapFieldForm(raw: Record<string, unknown>): VariableFieldForm {
  return {
    name: String(raw.name ?? ''),
    is_used: toBoolean(raw.is_used),
    is_global: toBoolean(raw.is_global),
  }
}

function mapSchema(raw: Record<string, unknown>): VariableSchema {
  return {
    id: Number(raw.id ?? 0),
    uuid: String(raw.uuid ?? ''),
    partner_id: raw.partner_id == null ? null : Number(raw.partner_id),
    name: String(raw.name ?? ''),
    global_data: isRecord(raw.global_data) ? raw.global_data : null,
    recipient_preview_data: Array.isArray(raw.recipient_preview_data)
      ? raw.recipient_preview_data.filter(isRecord)
      : null,
    fields: Array.isArray(raw.fields)
      ? raw.fields.filter(isRecord).map(mapField)
      : [],
    created_at: raw.created_at ? String(raw.created_at) : null,
    updated_at: raw.updated_at ? String(raw.updated_at) : null,
    partner: isRecord(raw.partner)
      ? {
          id: Number(raw.partner.id ?? 0),
          name: String(raw.partner.name ?? ''),
        }
      : null,
  }
}

function buildPayload(
  form: VariableSchemaForm,
  isAdmin: boolean,
  scopedPartnerId: number | null,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: form.name,
    global_data: form.global_data,
    recipient_preview_data: form.recipient_preview_data,
    fields: form.fields.map(field => ({
      name: field.name,
      is_global: field.is_global,
    })),
  }

  const partnerId = form.partner_id ?? scopedPartnerId
  if (isAdmin && partnerId !== null) {
    payload.partner_id = partnerId
  }

  return payload
}

export function useVariableSchemas() {
  const api = useApi()
  const auth = useAuthStore()
  const partner = usePartnerStore()
  const { withPartnerScope } = usePartnerScope()

  const schemas = ref<VariableSchema[]>([])
  const current = ref<VariableSchema | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const hasError = ref(false)

  async function fetchSchemas(): Promise<void> {
    isLoading.value = true
    hasError.value = false

    try {
      const { data, error } = await api.GET('/variable-schemas' as never, {
        params: {
          query: withPartnerScope({
            include: 'partner,variableFields',
          }),
        },
      } as never)

      if (error) {
        hasError.value = true
        return
      }

      const raw = data as { data?: Record<string, unknown>[] } | undefined
      schemas.value = Array.isArray(raw?.data)
        ? raw.data.filter(isRecord).map(mapSchema)
        : []
    }
    catch {
      hasError.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchSchema(uuid: string): Promise<VariableSchema | null> {
    isLoading.value = true
    hasError.value = false

    try {
      const { data, error } = await api.GET('/variable-schemas/{variableSchema}' as never, {
        params: {
          path: { variableSchema: uuid },
          query: { include: 'partner,variableFields' },
        },
      } as never)

      if (error) {
        hasError.value = true
        current.value = null
        return null
      }

      const raw = data as { data?: Record<string, unknown> } | undefined
      current.value = raw?.data && isRecord(raw.data) ? mapSchema(raw.data) : null
      return current.value
    }
    catch {
      hasError.value = true
      current.value = null
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  async function createSchema(form: VariableSchemaForm): Promise<boolean> {
    isSaving.value = true
    hasError.value = false

    try {
      const { data, error } = await api.POST('/variable-schemas' as never, {
        body: buildPayload(form, auth.isAdmin, partner.effectivePartnerId) as never,
      } as never)

      if (error) {
        hasError.value = true
        return false
      }

      const raw = data as { data?: Record<string, unknown> } | undefined
      current.value = raw?.data && isRecord(raw.data) ? mapSchema(raw.data) : null
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

  async function updateSchema(uuid: string, form: VariableSchemaForm): Promise<boolean> {
    isSaving.value = true
    hasError.value = false

    try {
      const { data, error } = await api.PUT('/variable-schemas/{variableSchema}' as never, {
        params: {
          path: { variableSchema: uuid },
        },
        body: buildPayload(form, auth.isAdmin, partner.effectivePartnerId) as never,
      } as never)

      if (error) {
        hasError.value = true
        return false
      }

      const raw = data as { data?: Record<string, unknown> } | undefined
      current.value = raw?.data && isRecord(raw.data) ? mapSchema(raw.data) : null
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

  async function deleteSchema(uuid: string): Promise<boolean> {
    isSaving.value = true
    hasError.value = false

    try {
      const { error } = await api.DELETE('/variable-schemas/{variableSchema}' as never, {
        params: {
          path: { variableSchema: uuid },
        },
      } as never)

      if (error) {
        hasError.value = true
        return false
      }

      schemas.value = schemas.value.filter(schema => schema.uuid !== uuid)
      if (current.value?.uuid === uuid) {
        current.value = null
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

  async function cloneSchema(uuid: string): Promise<VariableSchema | null> {
    isSaving.value = true
    hasError.value = false

    try {
      const { data, error } = await api.POST('/variable-schemas/{variableSchema}/clone' as never, {
        params: {
          path: { variableSchema: uuid },
        },
      } as never)

      if (error) {
        hasError.value = true
        return null
      }

      const raw = data as { data?: Record<string, unknown> } | undefined
      const cloned = raw?.data && isRecord(raw.data) ? mapSchema(raw.data) : null

      if (cloned) {
        schemas.value = [cloned, ...schemas.value.filter(schema => schema.uuid !== cloned.uuid)]
      }

      return cloned
    }
    catch {
      hasError.value = true
      return null
    }
    finally {
      isSaving.value = false
    }
  }

  async function discoverFromCsv(name: string, file: File): Promise<'not_implemented' | VariableSchemaForm | null> {
    isSaving.value = true
    hasError.value = false

    try {
      const body = new FormData()
      body.append('name', name)
      body.append('file', file)

      const { data, error } = await api.POST('/variable-schemas/discover' as never, {
        body: body as never,
      } as never)

      if (error) {
        if ((error as { status?: number }).status === 501) {
          return 'not_implemented'
        }

        hasError.value = true
        return null
      }

      const raw = data as { data?: Record<string, unknown> } | undefined
      const payload = raw?.data
      if (!payload || !isRecord(payload)) {
        return null
      }

      return {
        partner_id: auth.isAdmin ? partner.effectivePartnerId : auth.partnerId,
        name: typeof payload.name === 'string' ? payload.name : name,
        global_data: isRecord(payload.global_data) ? payload.global_data : null,
        recipient_preview_data: Array.isArray(payload.recipient_preview_data)
          ? payload.recipient_preview_data.filter(isRecord)
          : null,
        fields: Array.isArray(payload.fields)
          ? payload.fields.filter(isRecord).map(mapFieldForm)
          : [],
      }
    }
    catch {
      hasError.value = true
      return null
    }
    finally {
      isSaving.value = false
    }
  }

  return {
    schemas,
    current,
    isLoading,
    isSaving,
    hasError,
    fetchSchemas,
    fetchSchema,
    createSchema,
    updateSchema,
    deleteSchema,
    cloneSchema,
    discoverFromCsv,
  }
}
