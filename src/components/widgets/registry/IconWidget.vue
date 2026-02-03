<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { computed } from 'vue'
import { useGlobalStyles } from '@/composables/useGlobalStyles'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const { primaryColor } = useGlobalStyles()

const iconName = computed(() => props.widget.content.iconName || '⭐')
const iconSize = computed(() => props.widget.content.iconSize || '48px')
const hasLink = computed(() => !!props.widget.content.href)
const isPlaceholder = computed(() => !props.widget.content.iconName)

const wrapperStyle = computed(() => ({
  fontSize: iconSize.value,
  color: props.widget.content.iconColor || primaryColor.value,
  textAlign: props.widget.styles.textAlign || 'center',
  padding: props.widget.styles.padding,
  margin: props.widget.styles.margin,
}))
</script>

<template>
  <div class="icon-widget" :class="{ 'is-placeholder': isPlaceholder }" :style="wrapperStyle">
    <!-- Avec lien -->
    <a
      v-if="hasLink"
      :href="widget.content.href"
      :target="widget.content.href?.startsWith('http') ? '_blank' : '_self'"
      rel="noopener noreferrer"
      class="icon-link"
    >
      <span class="icon-display">{{ iconName }}</span>
    </a>

    <!-- Sans lien -->
    <span v-else class="icon-display">{{ iconName }}</span>
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
  transition: transform 0.2s, color 0.2s ease;
}

.icon-link {
  text-decoration: none;
  color: inherit;
}

.icon-link:hover .icon-display {
  transform: scale(1.15);
}

.icon-widget.is-placeholder {
  opacity: 0.5;
}
</style>
