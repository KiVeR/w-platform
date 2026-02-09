import type { VariableField, VariableSchema } from '../types/variable'

export const useVariableSchemaStore = defineStore('variableSchema', () => {
  const schema = ref<VariableSchema | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const selectedPreviewSetKey = ref<string | null>(null)

  const isAvailable = computed(() => schema.value !== null)

  const globalVariables = computed<VariableField[]>(
    () => schema.value?.globalVariables ?? [],
  )

  const recipientVariables = computed<VariableField[]>(
    () => schema.value?.recipientVariables ?? [],
  )

  const allVariables = computed<VariableField[]>(
    () => [...globalVariables.value, ...recipientVariables.value],
  )

  const variableNames = computed<string[]>(
    () => allVariables.value.map(v => v.name),
  )

  const globalDataSets = computed(
    () => schema.value?.dataSets ?? [],
  )

  const mergedPreviewData = computed<Record<string, string>>(() => {
    if (!schema.value || schema.value.dataSets.length === 0)
      return {}

    const key = selectedPreviewSetKey.value
    const found = key
      ? schema.value.dataSets.find(ds => ds.key === key)
      : null

    const dataSet = found ?? schema.value.dataSets[0]
    return dataSet.merged_preview_data
  })

  function setSchema(newSchema: VariableSchema) {
    schema.value = newSchema
    selectedPreviewSetKey.value = null
  }

  function clearSchema() {
    schema.value = null
    selectedPreviewSetKey.value = null
    error.value = null
  }

  function setPreviewSetKey(key: string) {
    selectedPreviewSetKey.value = key
  }

  function reset() {
    schema.value = null
    isLoading.value = false
    error.value = null
    selectedPreviewSetKey.value = null
  }

  return {
    schema,
    isLoading,
    error,
    selectedPreviewSetKey,
    isAvailable,
    globalVariables,
    recipientVariables,
    allVariables,
    variableNames,
    globalDataSets,
    mergedPreviewData,
    setSchema,
    clearSchema,
    setPreviewSetKey,
    reset,
  }
})
