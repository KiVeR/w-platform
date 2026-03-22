<script setup lang="ts">
import { Tag } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const { primaryColor } = useGlobalStyles()

const text = computed(() => props.widget.content.text || '')
const variant = computed(() => props.widget.content.variant || 'filled')

const hasContent = computed(() => !!text.value)

const badgeStyle = computed(() => {
  const styles = props.widget.styles
  const bgColor = styles.backgroundColor || primaryColor.value
  const badgeTextColor = styles.color || 'var(--color-surface, #ffffff)'

  const baseStyle = {
    display: 'inline-block',
    padding: styles.padding || '4px 12px',
    borderRadius: styles.borderRadius || '9999px',
    fontSize: styles.fontSize || '12px',
    fontWeight: styles.fontWeight || '600',
    fontFamily: styles.fontFamily,
    textTransform: styles.textTransform || 'uppercase',
    letterSpacing: '0.05em',
    lineHeight: '1.4',
  }

  if (variant.value === 'outline') {
    return {
      ...baseStyle,
      backgroundColor: 'transparent',
      border: `2px solid ${bgColor}`,
      color: bgColor,
    }
  }

  return {
    ...baseStyle,
    backgroundColor: bgColor,
    color: badgeTextColor,
    border: 'none',
  }
})
</script>

<template>
  <div
    class="badge-widget"
    :style="{
      textAlign: widget.styles.textAlign || 'center',
      margin: widget.styles.margin,
    }"
  >
    <!-- Placeholder when empty -->
    <div v-if="!hasContent" class="badge-placeholder">
      <Tag :size="24" class="placeholder-icon" />
      <span class="placeholder-text">Ajouter un badge</span>
    </div>

    <!-- Badge content -->
    <span v-else class="badge" :style="badgeStyle" role="status">
      {{ text }}
    </span>
  </div>
</template>

<style scoped>
.badge-placeholder {
  width: 100%;
  min-height: 80px;
  background-color: var(--color-neutral-100);
  border: 2px dashed var(--color-neutral-300);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-400);
}

.placeholder-icon {
  margin-bottom: 8px;
}

.placeholder-text {
  font-size: 14px;
}
</style>
