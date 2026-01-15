<script setup lang="ts">
import { useUIStore, type OptionsTab } from '@/stores/ui'
import { useSelectionStore } from '@/stores/selection'
import OptionsPanel from '@/components/options/OptionsPanel.vue'
import GlobalOptions from '@/components/options/GlobalOptions.vue'

const uiStore = useUIStore()
const selectionStore = useSelectionStore()

const tabs: { value: OptionsTab; label: string }[] = [
  { value: 'content', label: 'Contenu' },
  { value: 'style', label: 'Style' }
]
</script>

<template>
  <aside class="right-sidebar">
    <div class="sidebar-header">
      <div class="breadcrumb">
        <button
          class="breadcrumb-item home"
          :class="{ active: uiStore.activeTab === 'global' }"
          @click="uiStore.setActiveTab('global')"
          title="Options globales"
        >
          🏠
        </button>
        <span v-if="selectionStore.selectedWidget" class="breadcrumb-separator">›</span>
        <span v-if="selectionStore.selectedWidget" class="breadcrumb-item widget-name">
          {{ selectionStore.selectedWidget.type }}
        </span>
      </div>
    </div>

    <template v-if="selectionStore.selectedWidget && uiStore.activeTab !== 'global'">
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

    <template v-else>
      <div class="sidebar-content">
        <GlobalOptions />
      </div>
    </template>
  </aside>
</template>

<style scoped>
.right-sidebar {
  width: 320px;
  background-color: var(--color-surface);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-item {
  font-size: 14px;
  color: var(--color-text-muted);
}

.breadcrumb-item.home {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  cursor: pointer;
  transition: all 0.2s;
}

.breadcrumb-item.home:hover,
.breadcrumb-item.home.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.breadcrumb-separator {
  color: var(--color-text-muted);
}

.widget-name {
  font-weight: 500;
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
