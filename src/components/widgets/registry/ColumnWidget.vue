<script setup lang="ts">
import type { Widget, WidgetType } from '@/types/widget'
import { computed } from 'vue'
import draggable from 'vuedraggable'
import PreviewRenderer from '@/components/canvas/PreviewRenderer.vue'
import WidgetRendererInner from '@/components/canvas/WidgetRendererInner.vue'
import { canAcceptChild } from '@/config/widgets'
import { useSelectionStore } from '@/stores/selection'
import { useWidgetsStore } from '@/stores/widgets'
import { isWidgetConfigured } from '@/utils/widgetConfig'

const props = defineProps<{
  widget: Widget
  editable?: boolean
  isSelected?: boolean
  readonly?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const widgetsStore = useWidgetsStore()
const selectionStore = useSelectionStore()

const children = computed({
  get: () => props.widget.children || [],
  set: (value) => {
    widgetsStore.updateWidgetChildren(props.widget.id, value)
  },
})

const columnStyle = computed(() => {
  const width = props.widget.content.columnWidth || 'auto'

  // Convert percentage widths to flex-grow ratios so gap is handled automatically
  let flex = '1'
  if (width !== 'auto') {
    const pct = Number.parseFloat(width)
    if (!Number.isNaN(pct))
      flex = `${pct} 1 0%`
    else
      flex = '1'
  }

  return {
    flex,
    minWidth: '80px',
    padding: props.widget.styles.padding || '8px',
    margin: props.widget.styles.margin,
    backgroundColor: props.widget.styles.backgroundColor,
    borderRadius: props.widget.styles.borderRadius,
    boxShadow: props.widget.styles.boxShadow,
    backgroundImage: props.widget.styles.backgroundImage,
    backgroundSize: props.widget.styles.backgroundSize,
    backgroundPosition: props.widget.styles.backgroundPosition,
    backgroundRepeat: 'no-repeat' as const,
    borderLeft: props.widget.styles.borderLeft,
    borderRight: props.widget.styles.borderRight,
    borderTop: props.widget.styles.borderTop,
    borderBottom: props.widget.styles.borderBottom,
  }
})

// En mode preview, filtrer les enfants non configures
const configuredChildren = computed(() =>
  children.value.filter(isWidgetConfigured),
)

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
    :class="{
      'is-selected': isSelected && !readonly,
      'column-widget--readonly': readonly,
    }"
    :style="columnStyle"
    @click.self.stop="emit('click')"
    @dragover="!readonly && handleDragOver($event)"
    @drop="!readonly && handleDrop($event)"
  >
    <!-- Mode édition : draggable -->
    <draggable
      v-if="!readonly"
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
          @click="selectionStore.select(element.id)"
          @mouseenter="selectionStore.setHovered(element.id)"
          @mouseleave="selectionStore.setHovered(null)"
        />
      </template>
    </draggable>

    <!-- Mode preview : simple itération avec PreviewRenderer (enfants configures uniquement) -->
    <div v-else class="column-content">
      <PreviewRenderer
        v-for="element in configuredChildren"
        :key="element.id"
        :widget="element"
      />
    </div>

    <div v-if="!readonly && children.length === 0" class="empty-column">
      <p>Glissez un widget ici</p>
    </div>
  </div>
</template>

<style scoped>
.column-widget {
  min-height: 60px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px dashed #e2e8f0;
  border-radius: var(--radius-sm);
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

.column-widget--readonly {
  background: transparent;
  border: none;
  min-height: auto;
}

.column-widget--readonly:hover {
  border-color: transparent;
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
