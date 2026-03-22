<script setup lang="ts">
import { Database } from 'lucide-vue-next'

const store = useVariableSchemaStore()

const options = computed(() =>
  store.globalDataSets.map((ds: any) => ({
    key: ds.key,
    label: ds.key,
  })),
)

function onSelect(event: Event) {
  const key = (event.target as HTMLSelectElement).value
  store.setPreviewSetKey(key)
}
</script>

<template>
  <div v-if="store.isAvailable && options.length > 1" class="preview-dataset-selector">
    <label class="selector-label">
      <Database :size="14" />
      Jeu de données
    </label>
    <select
      class="selector-select"
      :value="store.selectedPreviewSetKey || options[0]?.key"
      @change="onSelect"
    >
      <option
        v-for="opt in options"
        :key="opt.key"
        :value="opt.key"
      >
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.preview-dataset-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary, #64748b);
  white-space: nowrap;
}

.selector-select {
  padding: 4px 8px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 6px);
  background: var(--color-surface, #fff);
  font-size: 12px;
  color: var(--color-text, #1e293b);
  cursor: pointer;
}

.selector-select:focus {
  outline: none;
  border-color: var(--color-primary, #14b8a6);
  box-shadow: var(--focus-ring);
}
</style>
