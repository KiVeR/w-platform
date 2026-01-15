<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { computed, ref } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const imageFront = computed(() => props.widget.content.flipcardImageFront || '')
const imageBack = computed(() => props.widget.content.flipcardImageBack || '')
const link = computed(() => props.widget.content.flipcardLink || '')

const hasImages = computed(() => imageFront.value && imageBack.value)

// État local pour la preview (retournement au clic en mode édition)
const isFlipped = ref(false)

function toggleFlip() {
  if (props.editable) {
    isFlipped.value = !isFlipped.value
  }
}
</script>

<template>
  <div
    class="flipcard-widget"
    :style="{
      padding: widget.styles.padding,
      margin: widget.styles.margin,
      textAlign: widget.styles.textAlign,
    }"
  >
    <div v-if="hasImages" class="flipcard-container">
      <!-- Badge -->
      <div class="flipcard-badge">
        <span class="badge">🔄 Carte retournable</span>
        <span v-if="editable" class="badge hint">Cliquez pour prévisualiser</span>
      </div>

      <!-- Carte avec effet 3D -->
      <div
        class="flipcard"
        :class="{ flipped: isFlipped }"
        @click="toggleFlip"
      >
        <div class="flipcard-inner">
          <!-- Face avant (recto) -->
          <div class="flipcard-face front">
            <img :src="imageFront" alt="Recto">
            <div class="face-label">
              Recto
            </div>
          </div>
          <!-- Face arrière (verso) -->
          <div class="flipcard-face back">
            <img :src="imageBack" alt="Verso">
            <div class="face-label">
              Verso
            </div>
          </div>
        </div>
      </div>

      <!-- Lien si configuré -->
      <div v-if="link" class="flipcard-link">
        <span class="link-icon">🔗</span>
        <span class="link-text">{{ link }}</span>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="flipcard-empty">
      <div class="empty-icon">
        🔄
      </div>
      <p class="empty-text">
        Carte retournable
      </p>
      <p class="empty-hint">
        Configurez les images recto/verso dans les options
      </p>
    </div>
  </div>
</template>

<style scoped>
.flipcard-widget {
  width: 100%;
}

.flipcard-container {
  display: inline-block;
}

.flipcard-badge {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.badge {
  padding: 4px 10px;
  background: #1e293b;
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.badge.hint {
  background: #6366f1;
}

.flipcard {
  perspective: 1000px;
  cursor: pointer;
}

.flipcard-inner {
  position: relative;
  width: 300px;
  height: 200px;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flipcard.flipped .flipcard-inner {
  transform: rotateY(180deg);
}

.flipcard-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.flipcard-face img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.flipcard-face.back {
  transform: rotateY(180deg);
}

.face-label {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.flipcard-link {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
}

.link-text {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flipcard-empty {
  padding: 32px 16px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 2px dashed #3b82f6;
  border-radius: 12px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.empty-text {
  color: #1e40af;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.empty-hint {
  color: #2563eb;
  font-size: 13px;
  margin: 0;
}
</style>
