<script setup lang="ts">
import { Braces } from 'lucide-vue-next'
import VariablePicker from './VariablePicker.vue'

defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  insert: [variable: string]
}>()

const isOpen = ref(false)

function toggle() {
  isOpen.value = !isOpen.value
}

function handleSelect(varName: string) {
  emit('insert', `\${${varName}}`)
  isOpen.value = false
}

function handleClose() {
  isOpen.value = false
}
</script>

<template>
  <div class="insert-variable-wrapper">
    <button
      class="insert-variable-btn"
      type="button"
      :disabled="disabled"
      title="Insérer une variable"
      aria-label="Insérer une variable"
      @click="toggle"
    >
      <Braces :size="16" />
    </button>
    <div v-if="isOpen" class="picker-popover">
      <VariablePicker
        :open="isOpen"
        @select="handleSelect"
        @close="handleClose"
      />
    </div>
  </div>
</template>

<style scoped>
.insert-variable-wrapper {
  position: relative;
  display: inline-flex;
}

.insert-variable-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 6px);
  background: var(--color-surface, #fff);
  color: var(--color-text-secondary, #64748b);
  cursor: pointer;
  transition: all var(--transition-fast, 0.15s);
}

.insert-variable-btn:hover:not(:disabled) {
  background: var(--color-surface-hover, #f1f5f9);
  color: var(--color-primary, #14b8a6);
  border-color: var(--color-primary, #14b8a6);
}

.insert-variable-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.picker-popover {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  z-index: 50;
}
</style>
