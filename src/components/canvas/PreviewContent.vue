<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useWidgetsStore } from '@/stores/widgets'
import { isWidgetConfigured } from '@/utils/widgetConfig'
import PreviewRenderer from './PreviewRenderer.vue'

const widgetsStore = useWidgetsStore()
const editorStore = useEditorStore()

// Filtrer les widgets non configures (image sans URL, video sans lien, etc.)
const configuredWidgets = computed(() =>
  widgetsStore.sortedItems.filter(isWidgetConfigured),
)
</script>

<template>
  <div
    class="preview-content"
    :style="{
      backgroundColor: editorStore.globalStyles.backgroundColor,
      color: editorStore.globalStyles.textColor,
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
