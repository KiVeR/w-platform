<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import type { Widget, WidgetType } from '@/types/widget'
import { useWidgetsStore } from '@/stores/widgets'
import { useSelectionStore } from '@/stores/selection'
import { canAcceptChild } from '@/config/widgets'
import WidgetRendererInner from '@/components/canvas/WidgetRendererInner.vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
  isSelected?: boolean
}>()

const widgetsStore = useWidgetsStore()
const selectionStore = useSelectionStore()

const children = computed({
  get: () => props.widget.children || [],
  set: (value) => {
    widgetsStore.updateWidgetChildren(props.widget.id, value)
  }
})

const columnStyle = computed(() => {
  const width = props.widget.content.columnWidth || 'auto'
  return {
    flex: width === 'auto' ? '1' : `0 0 calc(${width} - 16px)`,
    minWidth: '80px',
    padding: props.widget.styles.padding || '8px',
    backgroundColor: props.widget.styles.backgroundColor,
    borderRadius: props.widget.styles.borderRadius
  }
})

function handleDrop(event: DragEvent): void {
  event.preventDefault()
  event.stopPropagation()

  const widgetType = event.dataTransfer?.getData('widget-type') as WidgetType
  if (widgetType && canAcceptChild('column', widgetType)) {
    widgetsStore.addChildWidget(props.widget.id, widgetType)
  }
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault()
  event.stopPropagation()
}
</script>

<template>
  <div
    class="column-widget"
    :class="{ 'is-selected': isSelected }"
    :style="columnStyle"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <draggable
      v-model="children"
      item-key="id"
      group="widgets"
      ghost-class="widget-ghost"
      class="column-content"
    >
      <template #item="{ element }">
        <WidgetRendererInner
          :widget="element"
          :is-selected="selectionStore.selectedId === element.id"
          :is-hovered="selectionStore.hoveredId === element.id"
          @click.stop="selectionStore.select(element.id)"
          @mouseenter="selectionStore.setHovered(element.id)"
          @mouseleave="selectionStore.setHovered(null)"
        />
      </template>
    </draggable>

    <div v-if="children.length === 0" class="empty-column">
      <p>Glissez un widget ici</p>
    </div>
  </div>
</template>

<style scoped>
.column-widget {
  min-height: 60px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px dashed #e2e8f0;
  border-radius: 4px;
  transition: all 0.2s;
}

.column-widget:hover {
  border-color: var(--color-primary);
}

.column-widget.is-selected {
  border-color: var(--color-primary);
  border-style: solid;
  box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.2);
}

.column-content {
  min-height: 40px;
}

.empty-column {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  color: var(--color-text-muted);
  font-size: 11px;
  text-align: center;
}

.widget-ghost {
  opacity: 0.5;
  background: rgba(20, 184, 166, 0.1);
}
</style>
