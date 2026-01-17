<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { computed } from 'vue'
import { useGlobalStyles } from '@/composables/useGlobalStyles'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const { primaryColor, borderRadius } = useGlobalStyles()

const buttonStyles = computed(() => ({
  backgroundColor: props.widget.styles.backgroundColor || primaryColor.value,
  color: props.widget.styles.color || '#ffffff',
  fontSize: props.widget.styles.fontSize,
  fontWeight: props.widget.styles.fontWeight,
  borderRadius: props.widget.styles.borderRadius || borderRadius.value,
  textAlign: props.widget.styles.textAlign,
}))

const href = computed(() => {
  const { action, phone, href } = props.widget.content
  switch (action) {
    case 'tel':
      return `tel:${phone || ''}`
    case 'email':
      return `mailto:${href || ''}`
    default:
      return href || '#'
  }
})
</script>

<template>
  <div class="button-widget" :style="{ padding: widget.styles.padding, margin: widget.styles.margin }">
    <a
      :href="href"
      class="widget-button"
      :style="buttonStyles"
      @click.prevent
    >
      {{ widget.content.text || 'Bouton' }}
    </a>
  </div>
</template>

<style scoped>
.button-widget {
  position: relative;
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
