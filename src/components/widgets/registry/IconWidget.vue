<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { computed } from 'vue'
import { getLucideIcon } from '@/utils/lucide-icons'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const { primaryColor } = useGlobalStyles()

const iconName = computed(() => props.widget.content.iconName || 'Star')
const iconSize = computed(() => props.widget.content.iconSize || '48px')
const hasLink = computed(() => !!props.widget.content.href)
const isPlaceholder = computed(() => !props.widget.content.iconName)

const lucideComponent = computed(() => getLucideIcon(iconName.value))

// Convert iconSize string (e.g., '48px') to number for Lucide components
const iconSizeNumeric = computed(() => {
  const match = iconSize.value.match(/^(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 48
})

// Icon color for Lucide components
const iconColor = computed(() => props.widget.content.iconColor || primaryColor.value)

const wrapperStyle = computed(() => ({
  color: iconColor.value,
  textAlign: props.widget.styles.textAlign || 'center',
  padding: props.widget.styles.padding,
  margin: props.widget.styles.margin,
  opacity: props.widget.styles.opacity,
}))
</script>

<template>
  <div class="icon-widget" :class="{ 'is-placeholder': isPlaceholder }" :style="wrapperStyle">
    <component
      :is="hasLink ? 'a' : 'span'"
      :href="hasLink ? widget.content.href : undefined"
      :target="hasLink && widget.content.href?.startsWith('http') ? '_blank' : undefined"
      :rel="hasLink ? 'noopener noreferrer' : undefined"
      :class="{ 'icon-link': hasLink }"
    >
      <component
        :is="lucideComponent"
        v-if="lucideComponent"
        :size="iconSizeNumeric"
        :color="iconColor"
        class="icon-display"
      />
    </component>
  </div>
</template>

<style scoped>
.icon-widget {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.icon-display {
  display: inline-block;
  flex-shrink: 0;
  transition: transform 0.2s, color 0.2s ease;
}

.icon-link {
  text-decoration: none;
  color: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-link:hover .icon-display {
  transform: scale(1.15);
}

.icon-widget.is-placeholder {
  opacity: 0.5;
}
</style>
