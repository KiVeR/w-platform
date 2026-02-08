<script setup lang="ts">
import { GalleryHorizontal } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const images = computed(() => props.widget.content.sliderImages || [])
const hasImages = computed(() => images.value.length > 0)
const interval = computed(() => props.widget.content.sliderInterval || 3000)
const chevronColor = computed(() => props.widget.content.sliderChevronColor || '#ffffff')
const autoplay = computed(() => props.widget.content.sliderAutoplay !== false)

const currentIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const currentImage = computed(() => {
  if (!hasImages.value)
    return null
  return images.value[currentIndex.value]
})

function next() {
  if (!hasImages.value)
    return
  currentIndex.value = (currentIndex.value + 1) % images.value.length
}

function prev() {
  if (!hasImages.value)
    return
  currentIndex.value = (currentIndex.value - 1 + images.value.length) % images.value.length
}

function startAutoplay() {
  if (timer)
    clearInterval(timer)
  if (autoplay.value && hasImages.value && images.value.length > 1) {
    timer = setInterval(next, interval.value)
  }
}

function stopAutoplay() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch([autoplay, interval, images], () => {
  startAutoplay()
})

onMounted(() => {
  startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
})
</script>

<template>
  <div
    class="slider-widget"
    :style="{
      padding: widget.styles.padding,
      margin: widget.styles.margin,
    }"
    @mouseenter="stopAutoplay"
    @mouseleave="startAutoplay"
  >
    <div v-if="hasImages" class="slider-container">
      <!-- Badge -->
      <div class="slider-badge">
        <GalleryHorizontal :size="12" /> {{ currentIndex + 1 }} / {{ images.length }}
      </div>

      <!-- Image -->
      <div class="slider-viewport">
        <img
          v-if="currentImage"
          :src="currentImage.src"
          :alt="currentImage.alt || `Slide ${currentIndex + 1}`"
          class="slider-image"
        >

        <!-- Chevrons -->
        <button
          v-if="images.length > 1"
          class="slider-chevron prev"
          :style="{ color: chevronColor }"
          @click="prev"
        >
          ‹
        </button>
        <button
          v-if="images.length > 1"
          class="slider-chevron next"
          :style="{ color: chevronColor }"
          @click="next"
        >
          ›
        </button>
      </div>

      <!-- Indicateurs -->
      <div v-if="images.length > 1" class="slider-dots">
        <button
          v-for="(_, index) in images"
          :key="index"
          class="dot"
          :class="{ active: index === currentIndex }"
          @click="currentIndex = index"
        />
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="slider-empty">
      <div class="empty-icon">
        <GalleryHorizontal :size="48" />
      </div>
      <p class="empty-text">
        Ajouter des images au carrousel
      </p>
      <p class="empty-hint">
        Ajoutez des images dans les options
      </p>
    </div>
  </div>
</template>

<style scoped>
.slider-widget {
}

.slider-container {
  position: relative;
}

.slider-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.slider-viewport {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #1e293b;
}

.slider-image {
  width: 100%;
  height: auto;
  display: block;
  min-height: 200px;
  object-fit: cover;
}

.slider-chevron {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider-chevron:hover {
  background: rgba(0, 0, 0, 0.6);
}

.slider-chevron.prev {
  left: 8px;
  border-radius: 8px;
}

.slider-chevron.next {
  right: 8px;
  border-radius: 8px;
}

.slider-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background: #cbd5e1;
  cursor: pointer;
  transition: all 0.2s;
}

.dot.active {
  background: #6366f1;
  transform: scale(1.2);
}

.slider-empty {
  padding: 40px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  text-align: center;
}

.empty-icon {
  color: #64748b;
  margin-bottom: 8px;
}

.empty-text {
  color: #64748b;
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.empty-hint {
  color: #94a3b8;
  font-size: 13px;
  margin: 0;
}
</style>
