<script setup lang="ts">
import type { WidgetType } from '@/types/widget'
import { computed, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import WidgetRenderer from './WidgetRenderer.vue'

const widgetsStore = useWidgetsStore()
const selectionStore = useSelectionStore()
const editorStore = useEditorStore()
const presetsStore = usePresetsStore()
const { widgetGap, fontFamily, headingFontFamily, baseFontSize } = useGlobalStyles()

// Load global fonts dynamically
useGoogleFonts(fontFamily, headingFontFamily)

// Load per-widget custom fonts
watch(
  () => widgetsStore.sortedItems.map(w => w.styles.fontFamily).filter(Boolean),
  fontFamilies => fontFamilies.forEach(f => loadFont(f!)),
  { immediate: true },
)

const isDragOver = ref(false)

const widgets = computed({
  get: () => widgetsStore.sortedItems,
  set: (value) => {
    widgetsStore.setWidgets(value)
    editorStore.markAsDirty()
  },
})

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function handleDragLeave() {
  isDragOver.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false

  // Check for widget type (from WidgetPalette)
  const widgetType = event.dataTransfer?.getData('widget-type') as WidgetType
  if (widgetType) {
    widgetsStore.addWidget(widgetType)
    return
  }

  // Check for section preset (from SectionPalette)
  const sectionId = event.dataTransfer?.getData('section-preset')
  if (sectionId) {
    const section = presetsStore.getSectionById(sectionId)
    if (section) {
      presetsStore.addSection(section)
    }
  }
}

function handleWidgetClick(id: string) {
  selectionStore.select(id)
}

function handleCanvasClick(event: MouseEvent) {
  // Deselect when clicking on empty canvas area
  if ((event.target as HTMLElement).classList.contains('canvas-dropzone')) {
    selectionStore.deselect()
  }
}
</script>

<template>
  <div
    class="canvas-dropzone"
    :class="{ 'drag-over': isDragOver }"
    :style="{
      backgroundColor: editorStore.globalStyles.backgroundColor,
      color: editorStore.globalStyles.textColor,
      fontFamily,
      fontSize: baseFontSize,
    }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="handleCanvasClick"
  >
    <draggable
      v-model="widgets"
      item-key="id"
      handle=".widget-handle"
      ghost-class="widget-ghost"
      chosen-class="widget-chosen"
      drag-class="widget-drag"
      animation="200"
      class="widgets-list"
      :style="{ gap: widgetGap }"
    >
      <template #item="{ element }">
        <WidgetRenderer
          :widget="element"
          :is-selected="selectionStore.selectedId === element.id"
          :is-hovered="selectionStore.hoveredId === element.id"
          @click="handleWidgetClick(element.id)"
          @mouseenter="selectionStore.setHovered(element.id)"
          @mouseleave="selectionStore.setHovered(null)"
        />
      </template>
    </draggable>

    <div v-if="widgets.length === 0" class="empty-state">
      <div class="empty-icon">
        📱
      </div>
      <p class="empty-text">
        Glissez des widgets ici
      </p>
      <p class="empty-hint">
        ou cliquez sur un widget dans le panneau gauche
      </p>
    </div>
  </div>
</template>

<style scoped>
.canvas-dropzone {
  width: 100%;
  height: 100%;
  min-height: 100%;
  transition: background-color 0.2s;
  position: relative;
}

.canvas-dropzone.drag-over {
  background-color: rgba(20, 184, 166, 0.1) !important;
}

.widgets-list {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding-bottom: 100px;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--color-text-muted);
  pointer-events: none;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  opacity: 0.7;
}

/* Drag states */
:deep(.widget-ghost) {
  opacity: 0.5;
  background-color: rgba(20, 184, 166, 0.2);
}

:deep(.widget-chosen) {
  opacity: 0.8;
}

:deep(.widget-drag) {
  opacity: 0.9;
}
</style>
