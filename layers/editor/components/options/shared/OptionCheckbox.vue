<script setup lang="ts">
defineProps<{
  modelValue: boolean | undefined
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <label class="checkbox-wrapper">
    <input
      type="checkbox"
      class="checkbox-input"
      :checked="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    >
    <span class="checkbox-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-input:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

.checkbox-label {
  font-size: var(--text-sm);
  color: var(--color-text);
}
</style>
