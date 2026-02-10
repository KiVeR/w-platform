<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import draggable from 'vuedraggable'

const widgetsStore = useWidgetsStore()
const selectionStore = useSelectionStore()
const editorStore = useEditorStore()
const presetsStore = usePresetsStore()
const { widgetGap, fontFamily, headingFontFamily, baseFontSize } = useGlobalStyles()

useGoogleFonts(fontFamily, headingFontFamily)

watch(
  () => widgetsStore.sortedItems.map(w => w.styles.fontFamily).filter(Boolean),
  fontFamilies => fontFamilies.forEach(f => loadFont(f!)),
  { immediate: true },
)

const isDragOver = ref(false)
const dropzoneRef = ref<HTMLElement>()
const dropPosition = useDropPosition()

const widgets = computed({
  get: () => widgetsStore.sortedItems,
  set: (value) => {
    widgetsStore.setWidgets(value)
    editorStore.markAsDirty()
  },
})

function handleDragOver(event: DragEvent): void {
  event.preventDefault()
  isDragOver.value = true

  // If cursor is over a child container, let it handle its own drop indicator
  const target = event.target as HTMLElement
  if (target.closest('.column-widget') || target.closest('.form-widget')) {
    dropPosition.reset()
    return
  }

  const listEl = dropzoneRef.value?.querySelector('.widgets-list') as HTMLElement | null
  if (listEl) {
    dropPosition.handleDragOver(event, listEl, ':scope > *')
  }
}

function handleDragLeave(event: DragEvent): void {
  isDragOver.value = false
  if (dropzoneRef.value) {
    dropPosition.handleDragLeave(event, dropzoneRef.value)
  }
}

function handleDrop(event: DragEvent): void {
  event.preventDefault()
  isDragOver.value = false

  // Widget from WidgetPalette
  const widgetType = event.dataTransfer?.getData('widget-type') as WidgetType
  if (widgetType) {
    widgetsStore.addWidget(widgetType, dropPosition.dropIndex.value ?? undefined)
    dropPosition.reset()
    return
  }

  // Section preset from SectionPalette
  const sectionId = event.dataTransfer?.getData('section-preset')
  if (sectionId) {
    const section = presetsStore.getSectionById(sectionId)
    if (section) {
      presetsStore.addSection(section)
    }
  }

  dropPosition.reset()
}

function handleWidgetClick(id: string): void {
  selectionStore.select(id)
}

function handleCanvasClick(event: MouseEvent): void {
  if ((event.target as HTMLElement).classList.contains('canvas-dropzone')) {
    selectionStore.deselect()
  }
}
</script>

<template>
  <div
    ref="dropzoneRef"
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

    <div
      v-if="dropPosition.isActive.value"
      class="drop-indicator"
      :style="{ top: `${dropPosition.indicatorY.value}px` }"
    />
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

.drop-indicator {
  position: absolute;
  left: 8px;
  right: 8px;
  height: 3px;
  background: var(--color-primary);
  border-radius: 2px;
  pointer-events: none;
  z-index: 10;
  transition: top 0.15s ease;
}

.drop-indicator::before,
.drop-indicator::after {
  content: '';
  position: absolute;
  top: -3px;
  width: 9px;
  height: 9px;
  background: var(--color-primary);
  border-radius: 50%;
}

.drop-indicator::before {
  left: -4px;
}

.drop-indicator::after {
  right: -4px;
}
</style>
