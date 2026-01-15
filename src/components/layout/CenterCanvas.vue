<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
import DesignerMode from '@/components/modes/DesignerMode.vue'
import PreviewMode from '@/components/modes/PreviewMode.vue'
import ExpertMode from '@/components/modes/ExpertMode.vue'

const uiStore = useUIStore()
</script>

<template>
  <main class="center-canvas">
    <DesignerMode v-if="uiStore.mode === 'designer'" />
    <PreviewMode v-else-if="uiStore.mode === 'preview'" />
    <ExpertMode v-else-if="uiStore.mode === 'expert'" />
  </main>
</template>

<style scoped>
.center-canvas {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  overflow: hidden;
  padding: 24px;
}
</style>
