<script setup lang="ts">
import type { Widget } from '../../types/widget'
import { ImagePlus } from 'lucide-vue-next'

defineProps<{
  widget: Widget
  editable?: boolean
}>()
</script>

<template>
  <div class="image-widget" :style="widget.styles">
    <img
      v-if="widget.content.src"
      :src="widget.content.src"
      :alt="widget.content.alt || 'Image'"
      class="widget-image"
    >
    <div v-else class="image-placeholder">
      <ImagePlus :size="32" class="placeholder-icon" />
      <span class="placeholder-text">Ajouter une image</span>
    </div>
  </div>
</template>

<style scoped>
.image-widget {
  display: flex;
  justify-content: center;
}

.widget-image {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: inherit;
}

.image-placeholder {
  width: 100%;
  aspect-ratio: 16/9;
  background-color: #f1f5f9;
  border: 2px dashed #cbd5e1;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.placeholder-icon {
  margin-bottom: 8px;
}

.placeholder-text {
  font-size: 14px;
}
</style>
