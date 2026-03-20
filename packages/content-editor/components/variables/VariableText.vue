<script setup lang="ts">
import type { VariableField } from '../../types/variable'
import VariableBadge from './VariableBadge.vue'

const props = withDefaults(defineProps<{
  text?: string
  tag?: string
}>(), {
  text: '',
  tag: 'span',
})

const VARIABLE_PATTERN = /\$\{([^}]+)\}/g

interface Segment {
  type: 'text' | 'variable'
  value: string
}

const store = useVariableSchemaStore()

const schemaLoading = computed(() => !store.isAvailable)

const segments = computed<Segment[]>(() => {
  if (!props.text)
    return []

  const result: Segment[] = []
  let lastIndex = 0

  for (const match of props.text.matchAll(VARIABLE_PATTERN)) {
    const index = match.index!
    const variableName = match[1]
    if (index > lastIndex)
      result.push({ type: 'text', value: props.text.slice(lastIndex, index) })
    if (variableName)
      result.push({ type: 'variable', value: variableName })
    lastIndex = index + match[0].length
  }

  if (lastIndex < props.text.length)
    result.push({ type: 'text', value: props.text.slice(lastIndex) })

  return result
})

function getVariableType(name: string): 'global' | 'recipient' | undefined {
  const v = (store.allVariables as VariableField[]).find(f => f.name === name)
  return v?.type
}

function getPreviewValue(name: string): string | undefined {
  return store.mergedPreviewData[name]
}
</script>

<template>
  <component :is="tag" class="variable-text">
    <template v-for="(segment, i) in segments" :key="i">
      <template v-if="segment.type === 'text'">
        {{ segment.value }}
      </template>
      <VariableBadge
        v-else
        :name="segment.value"
        :type="getVariableType(segment.value)"
        :resolved="getPreviewValue(segment.value) !== undefined"
        :preview-value="getPreviewValue(segment.value)"
        :loading="schemaLoading"
      />
    </template>
  </component>
</template>

<style scoped>
.variable-text {
  display: inline;
}
</style>
