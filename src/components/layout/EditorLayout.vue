<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
import CenterCanvas from './CenterCanvas.vue'
import EditorToolbar from './EditorToolbar.vue'
import LeftSidebar from './LeftSidebar.vue'
import RightSidebar from './RightSidebar.vue'

const uiStore = useUIStore()
</script>

<template>
  <div class="editor-layout">
    <EditorToolbar />

    <div class="editor-content">
      <transition name="slide-left">
        <LeftSidebar v-if="uiStore.leftSidebarOpen" />
      </transition>

      <CenterCanvas />

      <transition name="slide-right">
        <RightSidebar v-if="uiStore.rightSidebarOpen" />
      </transition>
    </div>
  </div>
</template>

<style scoped>
.editor-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-background);
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
