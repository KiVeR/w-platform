<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import VariableText from '../../variables/VariableText.vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const widgetsStore = useWidgetsStore()
const { fontFamily, lineHeight } = useGlobalStyles()
const { hasVariables } = useVariables()

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

watch(() => props.widget.content.text, (newText) => {
  editText.value = newText || ''
})

function startEditing() {
  if (props.editable) {
    isEditing.value = true
  }
}

function stopEditing() {
  isEditing.value = false
  if (editText.value !== props.widget.content.text) {
    widgetsStore.updateWidgetContent(props.widget.id, { text: editText.value })
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    editText.value = props.widget.content.text || ''
    isEditing.value = false
  }
}
</script>

<template>
  <div class="text-widget" :style="textStyles">
    <textarea
      v-if="isEditing"
      v-model="editText"
      class="text-input"
      :style="{
        fontSize: widget.styles.fontSize,
        color: widget.styles.color,
        textAlign: widget.styles.textAlign,
      }"
      rows="4"
      autofocus
      @blur="stopEditing"
      @keydown="handleKeydown"
    />
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
.text-widget {
}

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
</style>
