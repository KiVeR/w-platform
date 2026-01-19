<script setup lang="ts">
import type { DesignDocument } from '@/types/widget'
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useWidgetsStore } from '@/stores/widgets'
import { isWidgetConfigured } from '@/utils/widgetConfig'
import PreviewRenderer from './PreviewRenderer.vue'

const props = defineProps<{
  design?: DesignDocument
}>()

const widgetsStore = useWidgetsStore()
const editorStore = useEditorStore()

// Use prop design if provided, otherwise fall back to stores
const configuredWidgets = computed(() => {
  const widgets = props.design?.widgets ?? widgetsStore.sortedItems
  return widgets.filter(isWidgetConfigured)
})

const globalStyles = computed(() => {
  return props.design?.globalStyles ?? editorStore.globalStyles
})
</script>

<template>
  <div
    class="preview-content"
    :style="{
      backgroundColor: globalStyles.backgroundColor,
      color: globalStyles.textColor,
    }"
  >
    <PreviewRenderer
      v-for="widget in configuredWidgets"
      :key="widget.id"
      :widget="widget"
    />
  </div>
</template>

<style scoped>
.preview-content {
  width: 100%;
  height: 100%;
  min-height: 100%;
}
</style>
