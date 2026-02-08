<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  icon?: string
  iconPosition?: 'start' | 'end'
  iconSize?: number
  iconColor?: string
  gap?: string
}>(), {
  iconPosition: 'start',
  iconSize: 18,
  gap: '8px',
})

const iconComponent = computed<Component | null>(() => {
  if (!props.icon)
    return null
  return getLucideIcon(props.icon)
})

const hasIcon = computed(() => !!iconComponent.value)

const containerStyle = computed(() => ({
  gap: props.gap,
}))

const iconStyle = computed(() => ({
  color: props.iconColor || 'inherit',
  flexShrink: 0,
}))
</script>

<template>
  <span class="icon-text" :class="{ 'icon-end': iconPosition === 'end' }" :style="containerStyle">
    <component
      :is="iconComponent"
      v-if="hasIcon && iconPosition === 'start'"
      :size="iconSize"
      :style="iconStyle"
      class="icon-text-icon"
    />
    <span class="icon-text-content">
      <slot />
    </span>
    <component
      :is="iconComponent"
      v-if="hasIcon && iconPosition === 'end'"
      :size="iconSize"
      :style="iconStyle"
      class="icon-text-icon"
    />
  </span>
</template>

<style scoped>
.icon-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-text-icon {
  line-height: 1;
}

.icon-text-content {
  line-height: inherit;
}
</style>
