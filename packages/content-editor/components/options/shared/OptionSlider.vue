<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number | undefined
  min?: number
  max?: number
  step?: number
  unit?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const displayValue = computed(() => {
  const val = props.modelValue ?? props.min ?? 0
  return props.unit ? `${val}${props.unit}` : val
})
</script>

<template>
  <div class="slider-wrapper">
    <input
      type="range"
      class="option-slider"
      :value="modelValue"
      :min="min ?? 0"
      :max="max ?? 100"
      :step="step ?? 1"
      @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    >
    <span class="slider-value">{{ displayValue }}</span>
  </div>
</template>

<style scoped>
.slider-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.option-slider {
  flex: 1;
  cursor: pointer;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-neutral-200);
  appearance: none;
}

.option-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.option-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.option-slider:focus {
  outline: none;
}

.option-slider:focus::-webkit-slider-thumb {
  box-shadow: var(--focus-ring);
}

.slider-value {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  min-width: 45px;
  text-align: right;
  font-family: var(--font-mono);
}
</style>
