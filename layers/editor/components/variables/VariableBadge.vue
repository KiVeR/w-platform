<script setup lang="ts">
import { Globe, User } from 'lucide-vue-next'

const props = defineProps<{
  name: string
  type?: 'global' | 'recipient'
  resolved?: boolean
  previewValue?: string
}>()

const tooltipText = computed(() => {
  if (props.previewValue)
    return `${props.name} → ${props.previewValue}`
  return props.name
})
</script>

<template>
  <span
    class="variable-badge"
    :class="[
      type ? `variable-badge--${type}` : 'variable-badge--recipient',
      { 'variable-badge--unresolved': resolved === false },
    ]"
    :title="tooltipText"
  >
    <Globe v-if="type === 'global'" :size="12" class="variable-badge-icon" />
    <User v-else :size="12" class="variable-badge-icon" />
    <span class="variable-badge-name">{{ name }}</span>
  </span>
</template>

<style scoped>
.variable-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  vertical-align: baseline;
  white-space: nowrap;
  cursor: default;
}

.variable-badge--global {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.variable-badge--recipient {
  background-color: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.variable-badge--unresolved {
  background-color: #ffedd5;
  color: #9a3412;
  border: 1px solid #fed7aa;
}

.variable-badge-icon {
  flex-shrink: 0;
}

.variable-badge-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
