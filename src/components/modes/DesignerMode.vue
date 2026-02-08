<script setup lang="ts">
// Initialize keyboard shortcuts for designer mode
useEditorKeyboard()
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
