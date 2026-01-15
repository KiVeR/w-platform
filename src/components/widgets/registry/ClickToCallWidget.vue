<script setup lang="ts">
import type { Widget } from '@/types/widget'

defineProps<{
  widget: Widget
  editable?: boolean
}>()
</script>

<template>
  <div class="click-to-call-widget" :style="{ padding: widget.styles.padding, margin: widget.styles.margin }">
    <a
      :href="`tel:${widget.content.phone || ''}`"
      class="widget-button"
      :style="{
        backgroundColor: widget.styles.backgroundColor,
        color: widget.styles.color,
        fontSize: widget.styles.fontSize,
        fontWeight: widget.styles.fontWeight,
        borderRadius: widget.styles.borderRadius,
      }"
      @click.prevent
    >
      <span class="phone-icon">📞</span>
      <span class="button-text">{{ widget.content.text || 'Appeler' }}</span>
    </a>
    <div v-if="widget.content.phone" class="phone-number">
      {{ widget.content.phone }}
    </div>
  </div>
</template>

<style scoped>
.click-to-call-widget {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.widget-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.widget-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.phone-icon {
  font-size: 1.1em;
}

.phone-number {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
