import type { DataSet, VariableField, VariableSchema } from '../types/variable'
import { useVariableSchemaStore } from '../stores/variableSchema'

export interface VariableSchemaInitOptions {
  schemaUuid?: string
  schema?: VariableSchema
  previewDataSetKey?: string
}

/**
 * Map the raw trigger-api response (snake_case, wrapped in `data`)
 * to the internal VariableSchema interface (camelCase).
 */
function mapApiResponse(raw: any): VariableSchema {
  const payload = raw.data ?? raw

  const globalVariables: VariableField[] = (payload.global_variables ?? []).map((v: any) => ({
    name: v.name,
    type: 'global' as const,
    description: v.description,
    example: v.example,
  }))

  const recipientVariables: VariableField[] = (payload.recipient_variables ?? []).map((v: any) => ({
    name: v.name,
    type: 'recipient' as const,
    description: v.description,
    example: v.example,
  }))

  // Build a lookup of global data keyed by key
  const globalDataMap = new Map<string, Record<string, string>>()
  for (const gd of payload.global_data ?? [])
    globalDataMap.set(gd.key, gd.data ?? {})

  // Build dataSets by merging global + recipient preview data
  const dataSets: DataSet[] = (payload.recipient_preview_data_sets ?? []).map((ds: any) => {
    const recipientData = ds.data ?? {}
    const globalKey = recipientData.global_parameters_key
    const globalData = globalKey ? (globalDataMap.get(globalKey) ?? {}) : {}
    // Exclude the linking key from merged data
    const { global_parameters_key: _, ...recipientFields } = recipientData
    return {
      key: ds.key,
      merged_preview_data: { ...globalData, ...recipientFields },
    }
  })

  // If no recipient sets but we have merged_preview_data from API, add a default set
  if (dataSets.length === 0 && payload.merged_preview_data) {
    dataSets.push({
      key: 'default',
      merged_preview_data: payload.merged_preview_data,
    })
  }

  return {
    uuid: payload.id ?? payload.uuid,
    globalVariables,
    recipientVariables,
    dataSets,
  }
}

export function useVariableSchema() {
  const store = useVariableSchemaStore()
  const api = useEditorApi()

  async function loadSchema(uuid: string): Promise<void> {
    store.isLoading = true
    store.error = null
    try {
      const raw = await api.get(`/variable-schemas/${uuid}`)
      if (raw)
        store.setSchema(mapApiResponse(raw))
    }
    catch (err: any) {
      store.error = err?.message ?? 'Failed to load variable schema'
    }
    finally {
      store.isLoading = false
    }
  }

  async function initialize(options: VariableSchemaInitOptions): Promise<void> {
    if (options.schema) {
      store.setSchema(options.schema)
    }
    else if (options.schemaUuid) {
      await loadSchema(options.schemaUuid)
    }

    if (options.previewDataSetKey)
      store.setPreviewSetKey(options.previewDataSetKey)
  }

  async function markUsed(variableNames: string[]): Promise<void> {
    if (!store.schema?.uuid)
      return
    try {
      await api.post(`/variable-schemas/${store.schema.uuid}/mark-used`, { variables: variableNames })
    }
    catch {
      // Silently fail — non-critical operation
    }
  }

  async function markUnused(variableNames: string[]): Promise<void> {
    if (!store.schema?.uuid)
      return
    try {
      await api.post(`/variable-schemas/${store.schema.uuid}/mark-unused`, { variables: variableNames })
    }
    catch {
      // Silently fail — non-critical operation
    }
  }

  return {
    initialize,
    loadSchema,
    markUsed,
    markUnused,
  }
}
