<script setup lang="ts">
import type { Widget } from '@/types/widget'

defineProps<{
  widget: Widget
  editable?: boolean
}>()

function getHref(widget: Widget): string {
  switch (widget.content.action) {
    case 'tel':
      return `tel:${widget.content.phone || ''}`
    case 'email':
      return `mailto:${widget.content.href || ''}`
    default:
      return widget.content.href || '#'
  }
}
</script>

<template>
  <div class="button-widget" :style="{ padding: widget.styles.padding, margin: widget.styles.margin }">
    <a
      :href="getHref(widget)"
      class="widget-button"
      :style="{
        backgroundColor: widget.styles.backgroundColor,
        color: widget.styles.color,
        fontSize: widget.styles.fontSize,
        fontWeight: widget.styles.fontWeight,
        borderRadius: widget.styles.borderRadius,
        textAlign: widget.styles.textAlign
      }"
      @click.prevent
    >
      {{ widget.content.text || 'Bouton' }}
    </a>
  </div>
</template>

<style scoped>
.button-widget {
  width: 100%;
  display: flex;
  justify-content: center;
}

.widget-button {
  display: inline-block;
  padding: 12px 24px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  width: 100%;
}

.widget-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>
