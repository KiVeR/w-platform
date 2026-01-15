<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
import CenterCanvas from './CenterCanvas.vue'
import EditorToolbar from './EditorToolbar.vue'
import LeftSidebar from './LeftSidebar.vue'
import RightSidebar from './RightSidebar.vue'

const uiStore = useUIStore()
</script>

<template>
  <div class="app-shell">
    <div class="shell-left">
      <transition name="slide-left">
        <LeftSidebar v-if="uiStore.leftSidebarOpen" />
      </transition>
    </div>

    <div class="shell-main">
      <EditorToolbar />
      <div class="canvas-wrapper">
        <CenterCanvas />
      </div>
    </div>

    <div class="shell-right">
      <transition name="slide-right">
        <RightSidebar v-if="uiStore.rightSidebarOpen" />
      </transition>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--color-background-subtle); /* Neutral/Darker background */
  overflow: hidden;
}

.shell-left,
.shell-right {
  display: flex;
  flex-direction: column;
  z-index: 20;
  /* Fixed width is handled by the components themselves, but we wrap them to control flow */
  flex-shrink: 0;
}

.shell-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0; /* Prevent flex overflow */
}

.canvas-wrapper {
  flex: 1;
  padding: 16px; /* The "frame" margin */
  background-color: transparent;
  display: flex;
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
