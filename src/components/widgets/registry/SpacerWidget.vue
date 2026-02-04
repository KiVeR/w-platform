<script setup lang="ts">
import type { Widget } from '@/types/widget'

defineProps<{
  widget: Widget
  editable?: boolean
  readonly?: boolean
}>()
</script>

<template>
  <div
    class="spacer-widget"
    :class="{ 'spacer-widget--readonly': readonly }"
    :style="{
      height: widget.styles.height || '32px',
      margin: widget.styles.margin,
      padding: widget.styles.padding,
      opacity: widget.styles.opacity,
    }"
  >
    <!-- Indicateur visible seulement en mode édition -->
    <div v-if="!readonly" class="spacer-indicator">
      <span class="spacer-label">{{ widget.styles.height || '32px' }}</span>
    </div>
  </div>
</template>

<style scoped>
.spacer-widget {
  position: relative;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(20, 184, 166, 0.05) 5px,
    rgba(20, 184, 166, 0.05) 10px
  );
}

.spacer-widget--readonly {
  background: transparent;
}

.spacer-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.2s;
}

.spacer-widget:hover .spacer-indicator {
  opacity: 1;
}

.spacer-label {
  font-size: 11px;
  color: var(--color-primary);
  background: white;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-primary);
}
</style>
