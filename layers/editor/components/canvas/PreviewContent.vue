<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  design?: DesignDocument
}>()

const widgetsStore = useWidgetsStore()
const editorStore = useEditorStore()
const { fontFamily, headingFontFamily } = useGlobalStyles()

useGoogleFonts(fontFamily, headingFontFamily)

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
      fontFamily: globalStyles.fontFamily,
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
