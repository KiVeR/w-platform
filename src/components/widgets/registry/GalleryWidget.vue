<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { computed } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const images = computed(() => props.widget.content.galleryImages || [])
const hasImages = computed(() => images.value.length > 0)
const buttonText = computed(() => props.widget.content.galleryButtonText || 'Voir la galerie')
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
    <!-- Bouton galerie -->
    <button class="gallery-button" @click.prevent>
      <span class="button-icon">🖼️</span>
      {{ buttonText }}
    </button>

    <!-- Preview des images -->
    <div v-if="hasImages" class="gallery-preview">
      <div class="gallery-grid">
        <div
          v-for="(image, index) in images.slice(0, 4)"
          :key="index"
          class="gallery-thumb"
        >
          <img :src="image.src" :alt="image.alt || `Image ${index + 1}`">
          <div v-if="index === 3 && images.length > 4" class="more-overlay">
            +{{ images.length - 4 }}
          </div>
        </div>
      </div>
      <div class="images-count">
        {{ images.length }} image{{ images.length > 1 ? 's' : '' }}
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="gallery-empty">
      <p class="empty-text">
        Aucune image
      </p>
      <p class="empty-hint">
        Ajoutez des images dans les options
      </p>
    </div>
  </div>
</template>

<style scoped>
.gallery-widget {
  width: 100%;
}

.gallery-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: 2px solid #6366f1;
  background: transparent;
  color: #6366f1;
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.gallery-button:hover {
  background: #6366f1;
  color: white;
}

.button-icon {
  font-size: 18px;
}

.gallery-preview {
  margin-top: 16px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-width: 320px;
  margin: 0 auto;
}

.gallery-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.images-count {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.gallery-empty {
  margin-top: 16px;
  padding: 20px;
  background: #f8fafc;
  border: 2px dashed #e2e8f0;
  border-radius: var(--radius-lg);
}

.empty-text {
  color: #64748b;
  font-size: 14px;
  margin: 0 0 4px 0;
}

.empty-hint {
  color: #94a3b8;
  font-size: 12px;
  margin: 0;
}
</style>
