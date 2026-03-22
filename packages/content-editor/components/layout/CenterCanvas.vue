<script setup lang="ts">
const uiStore = useUIStore()
</script>

<template>
  <main class="center-canvas">
    <DesignerMode v-if="uiStore.mode === 'designer'" />
    <PreviewMode v-else-if="uiStore.mode === 'preview'" />
    <LazyExpertMode v-else-if="uiStore.mode === 'expert'" />
    <LazyHistoryMode v-else-if="uiStore.mode === 'history'" />
  </main>
</template>

<style scoped>
.center-canvas {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  overflow: hidden;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25)); /* Deep shadow */
  border: 1px solid var(--color-border);
}
</style>
