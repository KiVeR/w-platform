<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { Hand, Link, Ticket } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const imageFg = computed(() => props.widget.content.scratchImageFg || '')
const imageBg = computed(() => props.widget.content.scratchImageBg || '')
const scratchSize = computed(() => props.widget.content.scratchSize || 30)
const scratchPercent = computed(() => props.widget.content.scratchPercent || 80)
const link = computed(() => props.widget.content.scratchLink || '')

const hasImages = computed(() => imageFg.value && imageBg.value)
</script>

<template>
  <div
    class="scratch-widget"
    :style="{
      padding: widget.styles.padding,
      margin: widget.styles.margin,
      textAlign: widget.styles.textAlign,
    }"
  >
    <div v-if="hasImages" class="scratch-container">
      <!-- Badges de config -->
      <div class="scratch-badges">
        <span class="badge"><Ticket :size="12" /> Carte à gratter</span>
        <span class="badge config">Pièce: {{ scratchSize }}px | {{ scratchPercent }}% requis</span>
      </div>

      <!-- Preview des deux images superposées -->
      <div class="scratch-preview">
        <!-- Image du dessous (révélée) -->
        <img
          :src="imageBg"
          alt="Image révélée"
          class="scratch-image bg"
        >
        <!-- Image du dessus (à gratter) - avec effet -->
        <img
          :src="imageFg"
          alt="Image à gratter"
          class="scratch-image fg"
        >
        <!-- Overlay d'indication -->
        <div class="scratch-overlay">
          <span class="scratch-hint"><Hand :size="16" /> Grattez pour découvrir</span>
        </div>
      </div>

      <!-- Lien si configuré -->
      <div v-if="link" class="scratch-link">
        <Link :size="12" />
        <span class="link-text">{{ link }}</span>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="scratch-empty">
      <div class="empty-icon">
        <Ticket :size="48" />
      </div>
      <p class="empty-text">
        Configurer la carte à gratter
      </p>
      <p class="empty-hint">
        Configurez les images dans les options
      </p>
    </div>
  </div>
</template>

<style scoped>
.scratch-widget {
}

.scratch-container {
  display: inline-block;
  position: relative;
}

.scratch-badges {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #1e293b;
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.badge.config {
  background: #64748b;
}

.scratch-preview {
  position: relative;
  display: inline-block;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.scratch-image {
  display: block;
  max-width: 100%;
  height: auto;
}

.scratch-image.bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scratch-image.fg {
  position: relative;
  z-index: 1;
}

.scratch-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2;
  pointer-events: none;
}

.scratch-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.95);
  color: #1e293b;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.scratch-link {
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

.scratch-empty {
  padding: 32px 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px dashed #f59e0b;
  border-radius: 12px;
  text-align: center;
}

.empty-icon {
  color: #92400e;
  margin-bottom: 8px;
}

.empty-text {
  color: #92400e;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.empty-hint {
  color: #b45309;
  font-size: 13px;
  margin: 0;
}
</style>
