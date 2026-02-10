<script setup lang="ts">
import { computed, ref } from 'vue'
import draggable from 'vuedraggable'

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
const columnRef = ref<HTMLElement>()
const dropPosition = useDropPosition()

const children = computed({
  get: () => props.widget.children || [],
  set: (value) => {
    widgetsStore.updateWidgetChildren(props.widget.id, value)
  },
})

function computeFlex(width: string): string {
  if (width === 'auto')
    return '1'

  const pct = Number.parseFloat(width)
  return Number.isNaN(pct) ? '1' : `${pct} 1 0%`
}

const columnStyle = computed(() => {
  const { styles } = props.widget
  const width = props.widget.content.columnWidth || 'auto'

  return {
    flex: computeFlex(width),
    minWidth: '80px',
    padding: styles.padding || '8px',
    margin: styles.margin,
    backgroundColor: styles.backgroundColor,
    borderRadius: styles.borderRadius,
    boxShadow: styles.boxShadow,
    backgroundImage: styles.backgroundImage,
    backgroundSize: styles.backgroundSize,
    backgroundPosition: styles.backgroundPosition,
    backgroundRepeat: 'no-repeat' as const,
    borderLeft: styles.borderLeft,
    borderRight: styles.borderRight,
    borderTop: styles.borderTop,
    borderBottom: styles.borderBottom,
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
    widgetsStore.addChildWidget(props.widget.id, widgetType, dropPosition.dropIndex.value ?? undefined)
  }
  dropPosition.reset()
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault()

  const contentEl = columnRef.value?.querySelector('.column-content') as HTMLElement | undefined
  if (contentEl)
    dropPosition.handleDragOver(event, contentEl, ':scope > *')
}

function handleDragLeave(event: DragEvent): void {
  if (!columnRef.value)
    return

  dropPosition.handleDragLeave(event, columnRef.value)
}
</script>

<template>
  <div
    ref="columnRef"
    class="column-widget"
    :class="{
      'is-selected': isSelected && !readonly,
      'column-widget--readonly': readonly,
    }"
    :style="columnStyle"
    @click.self.stop="emit('click')"
    @dragover="!readonly && handleDragOver($event)"
    @dragleave="!readonly && handleDragLeave($event)"
    @drop="!readonly && handleDrop($event)"
  >
    <!-- Mode édition : draggable -->
    <draggable
      v-if="!readonly"
      v-model="children"
      item-key="id"
      group="widgets"
      handle=".inner-widget-handle"
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

    <div v-if="dropPosition.isActive.value" class="drop-indicator" :style="{ top: `${dropPosition.indicatorY.value}px` }" />
  </div>
</template>

<style scoped>
.column-widget {
  position: relative;
  min-height: 60px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px dashed var(--color-neutral-200);
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

.drop-indicator {
  position: absolute;
  left: 4px;
  right: 4px;
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

.drop-indicator::before { left: -4px; }
.drop-indicator::after { right: -4px; }
</style>
