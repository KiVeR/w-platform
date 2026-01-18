<script setup lang="ts">
import type { OptionsTab } from '@/stores/ui'
import { computed, ref, watch } from 'vue'
import VersionHistorySidebar from '@/components/history/VersionHistorySidebar.vue'
import GlobalOptions from '@/components/options/GlobalOptions.vue'
import OptionsPanel from '@/components/options/OptionsPanel.vue'
import { useSelectionStore } from '@/stores/selection'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
const selectionStore = useSelectionStore()

type ContextMode = 'page' | 'widget'
const activeContext = ref<ContextMode>('page')

const hasSelectedWidget = computed(() => !!selectionStore.selectedWidget)

// Auto-switch to widget mode when a widget is selected
watch(() => selectionStore.selectedWidget, (widget) => {
  activeContext.value = widget ? 'widget' : 'page'
})

const tabs: { value: OptionsTab, label: string }[] = [
  { value: 'content', label: 'Contenu' },
  { value: 'style', label: 'Style' },
]

function setContext(mode: ContextMode) {
  if (mode === 'widget' && !hasSelectedWidget.value)
    return
  activeContext.value = mode
}
</script>

<template>
  <!-- History Mode: show version history sidebar -->
  <VersionHistorySidebar v-if="uiStore.isHistoryMode" />

  <!-- Normal Mode: show options sidebar -->
  <aside v-else class="right-sidebar">
    <!-- Segmented Control -->
    <div class="segmented-control">
      <button
        class="segment"
        :class="{ active: activeContext === 'page' }"
        @click="setContext('page')"
      >
        Page
      </button>
      <button
        class="segment"
        :class="{
          active: activeContext === 'widget',
          disabled: !hasSelectedWidget,
        }"
        :disabled="!hasSelectedWidget"
        @click="setContext('widget')"
      >
        Widget
      </button>
    </div>

    <!-- Page Mode -->
    <template v-if="activeContext === 'page'">
      <div class="sidebar-header">
        <span class="header-title">Options de la page</span>
      </div>
      <div class="sidebar-content">
        <GlobalOptions />
      </div>
    </template>

    <!-- Widget Mode -->
    <template v-else-if="activeContext === 'widget' && hasSelectedWidget">
      <div class="sidebar-header">
        <span class="widget-name">{{ selectionStore.selectedWidget?.type }}</span>
      </div>

      <div class="sidebar-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-btn"
          :class="{ active: uiStore.activeTab === tab.value }"
          @click="uiStore.setActiveTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="sidebar-content">
        <OptionsPanel />
      </div>
    </template>
  </aside>
</template>

<style scoped>
.right-sidebar {
  width: var(--sidebar-right-width);
  background-color: var(--color-surface);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
}

/* Segmented Control */
.segmented-control {
  display: flex;
  padding: 8px;
  gap: 4px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.segment {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background-color: var(--color-surface-hover);
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.segment:hover:not(.disabled) {
  background-color: var(--color-surface-active);
  color: var(--color-text);
}

.segment.active {
  background-color: var(--color-primary);
  color: white;
}

.segment.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sidebar-header {
  padding: 0 16px;
  height: var(--header-height);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.widget-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  text-transform: capitalize;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--color-text);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
</style>
