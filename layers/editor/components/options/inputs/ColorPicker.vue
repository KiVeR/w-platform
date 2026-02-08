<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  value: string
}>()

const emit = defineEmits<{
  (e: 'update:value', value: string): void
}>()

const localValue = ref(props.value)

watch(() => props.value, (newValue) => {
  localValue.value = newValue
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  localValue.value = target.value
  emit('update:value', target.value)
}

function handleTextInput(event: Event) {
  const target = event.target as HTMLInputElement
  let value = target.value

  // Auto-add # if missing
  if (value && !value.startsWith('#')) {
    value = `#${value}`
  }

  // Validate hex color
  if (/^#(?:[0-9A-F]{3}|[0-9A-F]{6})$/i.test(value)) {
    localValue.value = value
    emit('update:value', value)
  }
}
</script>

<template>
  <div class="color-picker">
    <input
      type="color"
      class="color-input"
      :value="localValue"
      @input="handleInput"
    >
    <input
      type="text"
      class="color-text"
      :value="localValue"
      placeholder="#000000"
      maxlength="7"
      @change="handleTextInput"
    >
  </div>
</template>

<style scoped>
.color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 40px;
  height: 40px;
  padding: 2px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: var(--color-surface);
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

.color-text {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: monospace;
  text-transform: uppercase;
}

.color-text:focus {
  outline: none;
  border-color: var(--color-primary);
}
</style>
