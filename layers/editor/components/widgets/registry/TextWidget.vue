<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue'
import VariableText from '../../variables/VariableText.vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const widgetsStore = useWidgetsStore()
const { fontFamily, lineHeight } = useGlobalStyles()
const { hasVariables } = useVariables()
const autocomplete = useVariableAutocomplete()

const resolveText = inject<((text: string) => string) | null>('resolveText', null)

const textStyles = computed(() => ({
  ...props.widget.styles,
  fontFamily: props.widget.styles.fontFamily || fontFamily.value,
  lineHeight: props.widget.styles.lineHeight || lineHeight.value,
}))

const displayText = computed(() => {
  const raw = props.widget.content.text || ''
  if (resolveText && !props.editable)
    return resolveText(raw)
  return raw
})

const showVariableBadges = computed(
  () => !resolveText && hasVariables(props.widget.content.text),
)

const isPlaceholder = computed(() => !props.widget.content.text?.trim())
const isEditing = ref(false)
const editText = ref(props.widget.content.text || '')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

watch(() => props.widget.content.text, (newText) => {
  editText.value = newText || ''
})

function startEditing() {
  if (props.editable) {
    isEditing.value = true
  }
}

function stopEditing() {
  autocomplete.dismiss()
  isEditing.value = false
  if (editText.value !== props.widget.content.text) {
    widgetsStore.updateWidgetContent(props.widget.id, { text: editText.value })
  }
}

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  editText.value = target.value
  autocomplete.handleInput(target.value, target.selectionStart ?? target.value.length)
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
  editText.value = newValue
  nextTick(() => {
    const newCursorPos = lastOpen + completed.length
    el.setSelectionRange(newCursorPos, newCursorPos)
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (autocomplete.isActive.value) {
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
    return
  }
  if (event.key === 'Escape') {
    editText.value = props.widget.content.text || ''
    isEditing.value = false
  }
}
</script>

<template>
  <div class="text-widget" :style="textStyles">
    <div v-if="isEditing" class="text-edit-wrapper">
      <textarea
        ref="textareaRef"
        :value="editText"
        class="text-input"
        :style="{
          fontSize: widget.styles.fontSize,
          color: widget.styles.color,
          textAlign: widget.styles.textAlign,
        }"
        rows="4"
        autofocus
        @input="onInput"
        @blur="stopEditing"
        @keydown="handleKeydown"
      />
      <div
        v-if="autocomplete.isActive.value && autocomplete.suggestions.value.length > 0"
        class="variable-autocomplete-dropdown"
      >
        <button
          v-for="(suggestion, idx) in autocomplete.suggestions.value"
          :key="suggestion.name"
          class="variable-autocomplete-item"
          :class="{ 'is-selected': idx === autocomplete.selectedIndex.value }"
          @mousedown.prevent="completeVariable(suggestion.name)"
        >
          <span class="variable-autocomplete-name">{{ suggestion.name }}</span>
          <span class="variable-autocomplete-type">{{ suggestion.type === 'global' ? 'Globale' : 'Destinataire' }}</span>
        </button>
      </div>
    </div>
    <p
      v-else
      class="text-content"
      :class="{ 'is-placeholder': isPlaceholder }"
      @dblclick="startEditing"
    >
      <VariableText v-if="showVariableBadges" :text="widget.content.text" tag="span" />
      <template v-else>
        {{ displayText || 'Texte...' }}
      </template>
    </p>
  </div>
</template>

<style scoped>
.text-content {
  margin: 0;
  font-size: inherit;
  color: inherit;
  text-align: inherit;
  line-height: 1.6;
  cursor: text;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.text-content.is-placeholder {
  opacity: 0.5;
  font-style: italic;
}

.text-edit-wrapper {
  position: relative;
}

.text-input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: white;
  outline: none;
  font-family: inherit;
  line-height: 1.6;
  padding: 8px;
  resize: vertical;
}

.variable-autocomplete-dropdown {
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
  max-height: 160px;
  overflow-y: auto;
}

.variable-autocomplete-item {
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

.variable-autocomplete-item:hover,
.variable-autocomplete-item.is-selected {
  background-color: var(--color-surface-hover, #f1f5f9);
}

.variable-autocomplete-name {
  font-weight: 500;
  color: var(--color-text, #1e293b);
}

.variable-autocomplete-type {
  font-size: 11px;
  color: var(--color-text-muted, #94a3b8);
}
</style>
