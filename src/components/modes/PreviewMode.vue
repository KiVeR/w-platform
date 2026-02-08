<script setup lang="ts">
import type { Component } from 'vue'
import { ArrowLeft, Monitor, Smartphone, Tablet } from 'lucide-vue-next'

const uiStore = useUIStore()

const devices: { value: PreviewDevice, label: string, icon: Component }[] = [
  { value: 'mobile', label: 'Mobile', icon: Smartphone },
  { value: 'tablet', label: 'Tablette', icon: Tablet },
  { value: 'desktop', label: 'Bureau', icon: Monitor },
]
</script>

<template>
  <div class="preview-mode">
    <!-- Preview toolbar -->
    <div class="preview-toolbar">
      <!-- Back to designer button -->
      <button
        class="back-to-designer"
        title="Retour au Designer (Escape)"
        @click="uiStore.setMode('designer')"
      >
        <ArrowLeft :size="16" />
        <span>Designer</span>
      </button>

      <!-- Device picker -->
      <div class="device-picker">
        <button
          v-for="device in devices"
          :key="device.value"
          class="device-btn"
          :class="{ active: uiStore.previewDevice === device.value }"
          :title="device.label"
          @click="uiStore.setPreviewDevice(device.value)"
        >
          <component :is="device.icon" :size="18" />
        </button>
      </div>
    </div>

    <MobileFrame :show-frame="true" :device="uiStore.previewDevice">
      <PreviewContent />
    </MobileFrame>
  </div>
</template>

<style scoped>
.preview-mode {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.preview-toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
  pointer-events: none;
}

.preview-toolbar > * {
  pointer-events: auto;
}

.back-to-designer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.back-to-designer:hover {
  background: var(--color-background-subtle);
  color: var(--color-text);
  border-color: var(--color-border-hover);
}

.device-picker {
  display: flex;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 4px;
  gap: 2px;
}

.device-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.device-btn:hover {
  background: var(--color-background-subtle);
  color: var(--color-text);
}

.device-btn.active {
  background: var(--color-primary);
  color: white;
}
</style>
