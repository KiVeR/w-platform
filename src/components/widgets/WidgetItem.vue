<script setup lang="ts">
import type { WidgetConfig } from '@/types/widget'
import { useWidgetsStore } from '@/stores/widgets'

const props = defineProps<{
  config: WidgetConfig
}>()

const widgetsStore = useWidgetsStore()

function handleDragStart(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('widget-type', props.config.type)
    event.dataTransfer.effectAllowed = 'copy'
  }
  widgetsStore.setDraggedWidgetType(props.config.type)
}

function handleDragEnd() {
  widgetsStore.setDraggedWidgetType(null)
}

function handleClick() {
  // Add widget directly on click
  widgetsStore.addWidget(props.config.type)
}
</script>

<template>
  <div
    class="widget-item"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
  >
    <div class="widget-icon">{{ config.icon }}</div>
    <div class="widget-label">{{ config.label }}</div>
  </div>
</template>

<style scoped>
.widget-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
}

.widget-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.widget-item:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.widget-icon {
  font-size: 24px;
  margin-bottom: 6px;
  color: var(--color-text-muted);
}

.widget-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>
