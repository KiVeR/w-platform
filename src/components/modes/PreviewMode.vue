<script setup lang="ts">
import MobileFrame from '@/components/canvas/MobileFrame.vue'
import PreviewContent from '@/components/canvas/PreviewContent.vue'
</script>

<template>
  <div class="preview-mode">
    <MobileFrame :show-frame="true">
      <PreviewContent />
    </MobileFrame>
  </div>
</template>

<style scoped>
.preview-mode {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
