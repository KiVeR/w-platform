<script setup lang="ts">
import { Images } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const images = computed(() => props.widget.content.galleryImages || [])
const hasImages = computed(() => images.value.length > 0)
const buttonText = computed(() => props.widget.content.galleryButtonText || 'Galerie photos')
const visibleImages = computed(() => images.value.slice(0, 6))
const extraCount = computed(() => Math.max(0, images.value.length - 6))
</script>

<template>
  <div
    class="gallery-widget"
    :style="{
      padding: widget.styles.padding,
      margin: widget.styles.margin,
      textAlign: widget.styles.textAlign,
    }"
  >
    <template v-if="hasImages">
      <!-- Header -->
      <div class="gallery-header">
        <span class="gallery-label">{{ buttonText }}</span>
        <span class="gallery-count">{{ images.length }} photo{{ images.length > 1 ? 's' : '' }}</span>
      </div>

      <!-- Grid -->
      <div class="gallery-grid">
        <div
          v-for="(image, index) in visibleImages"
          :key="index"
          class="gallery-item"
        >
          <img :src="image.src" :alt="image.alt || `Image ${index + 1}`">
          <div v-if="image.caption" class="gallery-caption">
            {{ image.caption }}
          </div>
          <div v-if="index === 5 && extraCount > 0" class="gallery-more">
            +{{ extraCount }}
          </div>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <div v-else class="gallery-empty">
      <div class="gallery-empty-icon">
        <Images :size="32" />
      </div>
      <p class="gallery-empty-text">
        Ajouter des images
      </p>
      <p class="gallery-empty-hint">
        Ajoutez des images dans les options du widget
      </p>
    </div>
  </div>
</template>

<style scoped>
.gallery-widget {
}

/* Header */
.gallery-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.gallery-label {
  font-size: 15px;
  font-weight: 600;
  color: currentColor;
}

.gallery-count {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 400;
}

/* Grid */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  width: 100%;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gallery-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px 6px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  color: white;
  font-size: 10px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gallery-more {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  color: white;
  font-size: 20px;
  font-weight: 700;
}

/* Empty state */
.gallery-empty {
  padding: 24px 16px;
  background: #f8fafc;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  text-align: center;
}

.gallery-empty-icon {
  display: flex;
  justify-content: center;
  color: #94a3b8;
  margin-bottom: 8px;
}

.gallery-empty-text {
  color: #64748b;
  font-size: 14px;
  margin: 0 0 4px 0;
}

.gallery-empty-hint {
  color: #94a3b8;
  font-size: 12px;
  margin: 0;
}
</style>
