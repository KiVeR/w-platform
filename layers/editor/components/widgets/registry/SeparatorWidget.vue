<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const { secondaryColor } = useGlobalStyles()

const wrapperStyles = computed(() => ({
  padding: props.widget.styles.padding,
  margin: props.widget.styles.margin,
  opacity: props.widget.styles.opacity,
}))

const separatorStyles = computed(() => ({
  borderStyle: props.widget.styles.borderStyle,
  borderColor: props.widget.styles.borderColor || secondaryColor.value,
  borderWidth: props.widget.styles.borderWidth,
}))
</script>

<template>
  <div class="separator-widget" :style="wrapperStyles">
    <hr class="widget-separator" :style="separatorStyles">
  </div>
</template>

<style scoped>
.separator-widget {
  position: relative;
}

.widget-separator {
  border: none;
  border-top-style: solid;
  border-top-width: 1px;
  border-top-color: #e2e8f0;
  margin: 0;
  transition: border-color 0.2s ease;
}
</style>
