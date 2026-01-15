<script setup lang="ts">
defineProps<{
  modelValue: string | undefined
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="color-picker-wrapper">
    <input
      type="color"
      class="color-picker"
      :value="modelValue || '#000000'"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
    <input
      type="text"
      class="color-text"
      :value="modelValue || ''"
      :placeholder="placeholder || '#000000'"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
  </div>
</template>

<style scoped>
.color-picker-wrapper {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.color-picker {
  width: 44px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  padding: 2px;
  background: var(--color-surface);
}

.color-picker:focus {
  outline: none;
  box-shadow: var(--focus-ring);
}

.color-text {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  background-color: var(--color-surface);
}

.color-text:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}
</style>
