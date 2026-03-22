<script setup lang="ts">
import { computed, provide } from 'vue'

const props = defineProps<{
  design?: DesignDocument
}>()

const widgetsStore = useWidgetsStore()
const editorStore = useEditorStore()
const { fontFamily, headingFontFamily } = useGlobalStyles()
const { resolveVariables } = useVariables()
const variableSchemaStore = useVariableSchemaStore()

useGoogleFonts(fontFamily, headingFontFamily)

// Provide resolveText so widgets can resolve ${variables} in preview mode
provide('resolveText', (text: string) => resolveVariables(text, variableSchemaStore.mergedPreviewData))
provide('isVariablePreview', true)

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
