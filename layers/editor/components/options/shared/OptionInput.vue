<script setup lang="ts">
defineProps<{
  modelValue: string | number | undefined
  type?: 'text' | 'url' | 'email' | 'tel' | 'number'
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    :type="type || 'text'"
    class="option-input"
    :value="modelValue"
    :placeholder="placeholder"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  >
</template>

<style scoped>
.option-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background-color: var(--color-surface);
  transition: border-color var(--transition-fast);
}

.option-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.option-input::placeholder {
  color: var(--color-text-muted);
}
</style>
