<script setup lang="ts">
import MobileFrame from '@/components/canvas/MobileFrame.vue'
import CanvasDropzone from '@/components/canvas/CanvasDropzone.vue'
</script>

<template>
  <div class="designer-mode">
    <MobileFrame device="mobile" :show-frame="true">
      <CanvasDropzone />
    </MobileFrame>
  </div>
</template>

<style scoped>
.designer-mode {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
