<script setup lang="ts">
import type { VariableField } from '../../../types/variable'
import InsertVariableButton from '../../variables/InsertVariableButton.vue'
import VariableBadge from '../../variables/VariableBadge.vue'

const props = defineProps<{
  modelValue: string | undefined
  placeholder?: string
  rows?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const store = useVariableSchemaStore()
const { hasVariables, extractVariables, insertAtCursor } = useVariables()
const autocomplete = useVariableAutocomplete()

const textValue = computed(() => props.modelValue ?? '')
const detectedVars = computed(() => extractVariables(textValue.value))
const showBadges = computed(() => hasVariables(textValue.value))

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  autocomplete.handleInput(target.value, target.selectionStart ?? target.value.length)
}

function onKeydown(event: KeyboardEvent) {
  if (!autocomplete.isActive.value)
    return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    autocomplete.moveDown()
  }
  else if (event.key === 'ArrowUp') {
    event.preventDefault()
    autocomplete.moveUp()
  }
  else if (event.key === 'Enter') {
    event.preventDefault()
    const selected = autocomplete.selectCurrent()
    if (selected)
      completeVariable(selected)
  }
  else if (event.key === 'Escape') {
    autocomplete.dismiss()
  }
}

function completeVariable(varName: string) {
  if (!textareaRef.value)
    return
  const el = textareaRef.value
  const cursorPos = el.selectionStart ?? el.value.length
  const before = el.value.slice(0, cursorPos)
  const lastOpen = before.lastIndexOf('${')
  if (lastOpen === -1)
    return
  const completed = `\${${varName}}`
  const newValue = el.value.slice(0, lastOpen) + completed + el.value.slice(cursorPos)
  el.value = newValue
  const newCursorPos = lastOpen + completed.length
  el.setSelectionRange(newCursorPos, newCursorPos)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  emit('update:modelValue', newValue)
}

function handleInsert(variable: string) {
  if (!textareaRef.value) {
    autocomplete.dismiss()
    return
  }

  const varName = variable.replace(/^\$\{|\}$/g, '')
  const el = textareaRef.value
  const cursorPos = el.selectionStart ?? el.value.length

  // If autocomplete is active, replace from the opening '${' to cursor
  if (autocomplete.isActive.value) {
    const before = el.value.slice(0, cursorPos)
    const lastOpen = before.lastIndexOf('${')
    if (lastOpen !== -1) {
      const completed = `\${${varName}}`
      const newValue = el.value.slice(0, lastOpen) + completed + el.value.slice(cursorPos)
      el.value = newValue
      const newCursorPos = lastOpen + completed.length
      el.setSelectionRange(newCursorPos, newCursorPos)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      emit('update:modelValue', newValue)
      autocomplete.dismiss()
      return
    }
  }

  // Otherwise insert at cursor (from button)
  const newValue = insertAtCursor(el, varName)
  emit('update:modelValue', newValue)
  autocomplete.dismiss()
}

function getVariableType(name: string): 'global' | 'recipient' | undefined {
  const v = (store.allVariables as VariableField[]).find(f => f.name === name)
  return v?.type
}

function getPreviewValue(name: string): string | undefined {
  return store.mergedPreviewData[name]
}
</script>

<template>
  <div class="option-textarea-with-variables">
    <div class="textarea-row">
      <div class="textarea-wrapper">
        <textarea
          ref="textareaRef"
          class="option-textarea"
          :value="modelValue"
          :placeholder="placeholder"
          :rows="rows || 4"
          @input="onInput"
          @keydown="onKeydown"
        />
        <div v-if="autocomplete.isActive.value && autocomplete.suggestions.value.length > 0" class="autocomplete-dropdown">
          <button
            v-for="(suggestion, idx) in autocomplete.suggestions.value"
            :key="suggestion.name"
            class="autocomplete-item"
            :class="{ 'is-selected': idx === autocomplete.selectedIndex.value }"
            @mousedown.prevent="completeVariable(suggestion.name)"
          >
            <span class="autocomplete-name">{{ suggestion.name }}</span>
            <span class="autocomplete-type">{{ suggestion.type === 'global' ? 'Globale' : 'Destinataire' }}</span>
          </button>
        </div>
      </div>
      <InsertVariableButton
        v-if="store.isAvailable"
        @insert="handleInsert"
      />
    </div>

    <div v-if="showBadges" class="detected-badges">
      <VariableBadge
        v-for="name in detectedVars"
        :key="name"
        :name="name"
        :type="getVariableType(name)"
        :resolved="getPreviewValue(name) !== undefined"
        :preview-value="getPreviewValue(name)"
      />
    </div>
  </div>
</template>

<style scoped>
.option-textarea-with-variables {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.textarea-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.textarea-wrapper {
  position: relative;
  flex: 1;
}

.textarea-wrapper .option-textarea {
  width: 100%;
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

.textarea-wrapper .option-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.textarea-wrapper .option-textarea::placeholder {
  color: var(--color-text-muted);
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 2px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 6px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
  z-index: 50;
  max-height: 180px;
  overflow-y: auto;
}

.autocomplete-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}

.autocomplete-item:hover,
.autocomplete-item.is-selected {
  background-color: var(--color-surface-hover, #f1f5f9);
}

.autocomplete-name {
  font-weight: 500;
  color: var(--color-text, #1e293b);
}

.autocomplete-type {
  font-size: 11px;
  color: var(--color-text-muted, #94a3b8);
}

.detected-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
