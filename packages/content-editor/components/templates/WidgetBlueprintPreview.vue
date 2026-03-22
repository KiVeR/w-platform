<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  widgets: Widget[]
  backgroundColor?: string
  textColor?: string
  compact?: boolean
  scrollable?: boolean
}>(), {
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
})

const MOBILE_WIDTH = 375

const containerRef = ref<HTMLElement>()
const scale = ref(1)

const viewportStyle = computed(() => {
  const base = {
    width: `${MOBILE_WIDTH}px`,
    backgroundColor: props.backgroundColor,
    color: props.textColor,
  }
  if (props.scrollable)
    return { ...base, zoom: scale.value }
  return { ...base, transform: `scale(${scale.value})` }
})

function updateScale() {
  if (!containerRef.value)
    return
  scale.value = containerRef.value.offsetWidth / MOBILE_WIDTH
}

let observer: ResizeObserver | undefined

onMounted(() => {
  updateScale()
  observer = new ResizeObserver(updateScale)
  if (containerRef.value)
    observer.observe(containerRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div
    ref="containerRef"
    class="mini-render"
    :class="{ compact, scrollable }"
  >
    <div
      class="mini-render-viewport"
      :style="viewportStyle"
    >
      <PreviewRenderer
        v-for="widget in widgets"
        :key="widget.id"
        :widget="widget"
      />
    </div>
  </div>
</template>

<style scoped>
.mini-render {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--radius-sm);
  position: relative;
}

.mini-render.scrollable {
  height: auto;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}

.mini-render.scrollable::-webkit-scrollbar {
  width: 4px;
}

.mini-render.scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.mini-render.scrollable::-webkit-scrollbar-thumb {
  background-color: var(--color-neutral-300, #cbd5e1);
  border-radius: 2px;
}

.mini-render-viewport {
  transform-origin: top left;
  pointer-events: none;
  user-select: none;
}

.mini-render.scrollable .mini-render-viewport {
  transform: none !important;
}
</style>
