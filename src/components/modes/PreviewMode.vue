<script setup lang="ts">
import CanvasDropzone from '@/components/canvas/CanvasDropzone.vue'
import MobileFrame from '@/components/canvas/MobileFrame.vue'

type Device = 'mobile' | 'tablet' | 'desktop'
const devices: Device[] = ['mobile', 'tablet', 'desktop']
</script>

<template>
  <div class="preview-mode">
    <div class="devices-row">
      <div
        v-for="device in devices"
        :key="device"
        class="device-preview"
      >
        <MobileFrame :device="device" :show-frame="true">
          <CanvasDropzone />
        </MobileFrame>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-mode {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  padding: 20px;
}

.devices-row {
  display: flex;
  gap: 40px;
  justify-content: center;
  align-items: flex-start;
  min-width: max-content;
}

.device-preview {
  flex-shrink: 0;
  transform: scale(0.7);
  transform-origin: top center;
}
</style>
