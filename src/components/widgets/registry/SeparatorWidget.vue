<script setup lang="ts">
import type { Widget } from '@/types/widget'

defineProps<{
  widget: Widget
  editable?: boolean
}>()
</script>

<template>
  <div class="separator-widget" :style="{ padding: widget.styles.padding, margin: widget.styles.margin }">
    <hr
      class="widget-separator"
      :style="{
        borderStyle: widget.styles.borderStyle,
        borderColor: widget.styles.borderColor,
        borderWidth: widget.styles.borderWidth,
      }"
    >
  </div>
</template>

<style scoped>
.separator-widget {
  width: 100%;
}

.widget-separator {
  border: none;
  border-top-style: solid;
  border-top-width: 1px;
  border-top-color: #e2e8f0;
  margin: 0;
}
</style>
