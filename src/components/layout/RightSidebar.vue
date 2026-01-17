<script setup lang="ts">
import type { OptionsTab } from '@/stores/ui'
import OptionsPanel from '@/components/options/OptionsPanel.vue'
import { useSelectionStore } from '@/stores/selection'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
const selectionStore = useSelectionStore()

const tabs: { value: OptionsTab, label: string }[] = [
  { value: 'content', label: 'Contenu' },
  { value: 'style', label: 'Style' },
]
</script>

<template>
  <aside class="right-sidebar">
    <div class="sidebar-header">
      <span v-if="selectionStore.selectedWidget" class="widget-name">
        {{ selectionStore.selectedWidget.type }}
      </span>
      <span v-else class="header-title">Propriétés</span>
    </div>

    <template v-if="selectionStore.selectedWidget">
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
      <div class="sidebar-empty">
        <p class="empty-text">
          Sélectionnez un widget pour modifier ses propriétés
        </p>
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

.sidebar-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.empty-text {
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.5;
}
</style>
