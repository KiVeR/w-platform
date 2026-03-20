<script setup lang="ts">
defineProps<{
  modelValue: string | undefined
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const shadowOptions = DESIGN_TOKENS.boxShadow.map(value => ({
  value,
  label: BOX_SHADOW_LABELS[value] || value,
}))
</script>

<template>
  <div class="shadow-picker">
    <div
      class="shadow-preview"
      :style="{ boxShadow: modelValue || 'none' }"
    />
    <select
      class="option-select shadow-select"
      :value="modelValue || 'none'"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="opt in shadowOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.shadow-picker {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shadow-preview {
  width: 32px;
  height: 32px;
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}

.shadow-select {
  flex: 1;
}
</style>
