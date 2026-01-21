<script setup lang="ts">
import { Pencil } from 'lucide-vue-next'
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  maxLength?: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'save': [value: string]
}>()

const isEditing = ref(false)
const localValue = ref(props.modelValue)
const inputRef = ref<HTMLInputElement | null>(null)

watch(() => props.modelValue, (newVal) => {
  if (!isEditing.value) {
    localValue.value = newVal
  }
})

async function startEdit() {
  if (props.disabled)
    return

  isEditing.value = true
  localValue.value = props.modelValue

  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

function confirmEdit() {
  const trimmed = localValue.value.trim()

  if (!trimmed) {
    // Revert to previous value if empty
    localValue.value = props.modelValue
    isEditing.value = false
    return
  }

  if (trimmed !== props.modelValue) {
    emit('update:modelValue', trimmed)
    emit('save', trimmed)
  }

  isEditing.value = false
}

function cancelEdit() {
  localValue.value = props.modelValue
  isEditing.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    confirmEdit()
  }
  else if (event.key === 'Escape') {
    event.preventDefault()
    cancelEdit()
  }
}

// Expose method for external focus (from toast action)
defineExpose({
  startEdit,
})
</script>

<template>
  <div
    class="editable-title"
    :class="{
      'is-editing': isEditing,
      'is-disabled': disabled,
    }"
  >
    <input
      v-if="isEditing"
      ref="inputRef"
      v-model="localValue"
      type="text"
      class="editable-title__input"
      :maxlength="maxLength || 100"
      :placeholder="placeholder"
      @blur="confirmEdit"
      @keydown="handleKeydown"
    >
    <button
      v-else
      type="button"
      class="editable-title__display"
      :disabled="disabled"
      :title="disabled ? undefined : 'Cliquez pour modifier le titre'"
      @click="startEdit"
    >
      <span class="editable-title__text">{{ modelValue || placeholder }}</span>
      <Pencil v-if="!disabled" :size="12" class="editable-title__icon" />
    </button>
  </div>
</template>

<style scoped>
.editable-title {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 200px;
}

.editable-title__display {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: text;
  transition: all var(--transition-fast);
  max-width: 100%;
  text-align: left;
}

.editable-title__display:not(:disabled):hover {
  background-color: var(--color-background);
  border-color: var(--color-border);
}

.editable-title__display:not(:disabled):hover .editable-title__text {
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}

.editable-title__display:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.editable-title__display:disabled {
  cursor: default;
}

.editable-title__text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.editable-title__icon {
  flex-shrink: 0;
  color: var(--color-text-muted);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.editable-title__display:hover .editable-title__icon,
.editable-title__display:focus-visible .editable-title__icon {
  opacity: 1;
}

.editable-title__input {
  width: 100%;
  min-width: 120px;
  max-width: 200px;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background-color: white;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  outline: none;
  box-shadow: var(--focus-ring);
}

.editable-title__input::placeholder {
  color: var(--color-text-muted);
  font-weight: normal;
}

.editable-title.is-disabled .editable-title__display {
  color: var(--color-text-muted);
}
</style>
