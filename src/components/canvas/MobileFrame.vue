<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  device?: 'mobile' | 'tablet' | 'desktop'
  showFrame?: boolean
}>(), {
  device: 'mobile',
  showFrame: true,
})

const dimensions = computed(() => {
  switch (props.device) {
    case 'mobile':
      return { width: 375, height: 667, label: 'iPhone 8' }
    case 'tablet':
      return { width: 414, height: 736, label: 'iPhone 8 Plus' }
    case 'desktop':
      return { width: 428, height: 926, label: 'iPhone X' }
    default:
      return { width: 375, height: 667, label: 'Mobile' }
  }
})
</script>

<template>
  <div class="mobile-frame-container">
    <div
      class="mobile-frame"
      :class="{ 'with-frame': showFrame }"
      :style="{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }"
    >
      <div v-if="showFrame" class="frame-notch" />
      <div class="frame-content">
        <slot />
      </div>
      <div v-if="showFrame" class="frame-home-indicator" />
    </div>
    <div v-if="showFrame" class="device-label">
      {{ dimensions.label }}
    </div>
  </div>
</template>

<style scoped>
.mobile-frame-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mobile-frame {
  position: relative;
  background-color: white;
  overflow: hidden;
  transition: all 0.3s ease;
}

.mobile-frame.with-frame {
  border: 12px solid #1e293b;
  border-radius: 40px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.frame-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 150px;
  height: 24px;
  background-color: #1e293b;
  border-radius: 0 0 20px 20px;
  z-index: 10;
}

.frame-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: white;
}

.frame-home-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 134px;
  height: 5px;
  background-color: #1e293b;
  border-radius: 3px;
}

.device-label {
  margin-top: 12px;
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
