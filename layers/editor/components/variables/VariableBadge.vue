<script setup lang="ts">
import { Globe, User } from 'lucide-vue-next'

const props = defineProps<{
  name: string
  type?: 'global' | 'recipient'
  resolved?: boolean
  previewValue?: string
  loading?: boolean
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
      loading
        ? 'variable-badge--loading'
        : type ? `variable-badge--${type}` : 'variable-badge--recipient',
      { 'variable-badge--unresolved': !loading && resolved === false },
    ]"
    :title="tooltipText"
  >
    <template v-if="!loading">
      <Globe v-if="type === 'global'" :size="12" class="variable-badge-icon" />
      <User v-else :size="12" class="variable-badge-icon" />
    </template>
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

.variable-badge--loading {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
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
