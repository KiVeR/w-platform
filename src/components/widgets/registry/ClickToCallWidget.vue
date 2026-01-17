<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { computed } from 'vue'
import { useGlobalStyles } from '@/composables/useGlobalStyles'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const { primaryColor, borderRadius } = useGlobalStyles()

const isFullWidth = computed(() => props.widget.styles.widthMode !== 'auto')

const wrapperStyles = computed(() => ({
  padding: props.widget.styles.padding,
  margin: props.widget.styles.margin,
  textAlign: props.widget.styles.textAlign || 'center',
}))

const buttonStyles = computed(() => ({
  backgroundColor: props.widget.styles.backgroundColor || primaryColor.value,
  color: props.widget.styles.color || '#ffffff',
  fontSize: props.widget.styles.fontSize,
  fontWeight: props.widget.styles.fontWeight,
  borderRadius: props.widget.styles.borderRadius || borderRadius.value,
}))
</script>

<template>
  <div class="click-to-call-widget" :style="wrapperStyles">
    <a
      :href="`tel:${widget.content.phone || ''}`"
      class="widget-button"
      :class="{ 'is-full-width': isFullWidth }"
      :style="buttonStyles"
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
}

.widget-button.is-full-width {
  display: flex;
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
