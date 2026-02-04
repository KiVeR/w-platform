<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { computed } from 'vue'
import IconText from '@/components/ui/IconText.vue'
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
  boxShadow: props.widget.styles.boxShadow,
  letterSpacing: props.widget.styles.letterSpacing,
  textTransform: props.widget.styles.textTransform,
}))

// Default to Phone icon, but allow customization
const icon = computed(() => props.widget.content.icon || 'Phone')
const iconPosition = computed(() => props.widget.content.iconPosition || 'start')
const iconSize = computed(() => {
  const fontSizeStr = props.widget.styles.fontSize || '16px'
  const fontSize = Number.parseFloat(fontSizeStr)
  return Math.round(fontSize * 1.1)
})
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
      <IconText
        :icon="icon"
        :icon-position="iconPosition"
        :icon-size="iconSize"
        gap="8px"
      >
        {{ widget.content.text || 'Appeler' }}
      </IconText>
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

.phone-number {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
