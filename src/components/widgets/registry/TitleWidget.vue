<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { computed, ref, watch } from 'vue'
import { useGlobalStyles } from '@/composables/useGlobalStyles'
import { useWidgetsStore } from '@/stores/widgets'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const widgetsStore = useWidgetsStore()
const { headingFontFamily } = useGlobalStyles()

const titleStyles = computed(() => ({
  ...props.widget.styles,
  fontFamily: props.widget.styles.fontFamily || headingFontFamily.value,
}))

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
  if (event.key === 'Enter') {
    event.preventDefault()
    stopEditing()
  }
  if (event.key === 'Escape') {
    editText.value = props.widget.content.text || ''
    isEditing.value = false
  }
}
</script>

<template>
  <div class="title-widget" :style="titleStyles">
    <input
      v-if="isEditing"
      v-model="editText"
      class="title-input"
      :style="{
        fontSize: widget.styles.fontSize,
        fontWeight: widget.styles.fontWeight,
        color: widget.styles.color,
        textAlign: widget.styles.textAlign,
      }"
      autofocus
      @blur="stopEditing"
      @keydown="handleKeydown"
    >
    <h1
      v-else
      class="title-text"
      :class="{ 'is-placeholder': isPlaceholder }"
      @dblclick="startEditing"
    >
      {{ widget.content.text || 'Titre' }}
    </h1>
  </div>
</template>

<style scoped>
.title-widget {
}

.title-text {
  margin: 0;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  text-align: inherit;
  cursor: text;
  word-wrap: break-word;
}

.title-text.is-placeholder {
  opacity: 0.5;
  font-style: italic;
}

.title-input {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-family: inherit;
  margin: 0;
  padding: 0;
}
</style>
