<script setup lang="ts">
defineProps<{
  modelValue: string | undefined
  placeholder?: string
  rows?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <textarea
    class="option-textarea"
    :value="modelValue"
    :placeholder="placeholder"
    :rows="rows || 4"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

<style scoped>
.option-textarea {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background-color: var(--color-surface);
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  transition: border-color var(--transition-fast);
}

.option-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.option-textarea::placeholder {
  color: var(--color-text-muted);
}
</style>
