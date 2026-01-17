<script setup lang="ts">
import { ref } from 'vue'
import SectionPalette from '@/components/templates/SectionPalette.vue'
import TemplatePalette from '@/components/templates/TemplatePalette.vue'
import WidgetPalette from '@/components/widgets/WidgetPalette.vue'

type Tab = 'widgets' | 'templates' | 'sections' | 'effects'
const activeTab = ref<Tab>('widgets')
</script>

<template>
  <aside class="left-sidebar">
    <div class="sidebar-tabs" role="tablist">
      <button
        class="tab-btn"
        role="tab"
        :class="{ active: activeTab === 'widgets' }"
        :aria-selected="activeTab === 'widgets'"
        @click="activeTab = 'widgets'"
      >
        Widgets
      </button>
      <button
        class="tab-btn"
        role="tab"
        :class="{ active: activeTab === 'templates' }"
        :aria-selected="activeTab === 'templates'"
        @click="activeTab = 'templates'"
      >
        Modèles
      </button>
      <button
        class="tab-btn"
        role="tab"
        :class="{ active: activeTab === 'sections' }"
        :aria-selected="activeTab === 'sections'"
        @click="activeTab = 'sections'"
      >
        Sections
      </button>
      <button
        class="tab-btn"
        role="tab"
        :class="{ active: activeTab === 'effects' }"
        :aria-selected="activeTab === 'effects'"
        @click="activeTab = 'effects'"
      >
        Effets
      </button>
    </div>

    <div class="sidebar-content">
      <WidgetPalette v-if="activeTab === 'widgets'" />
      <TemplatePalette v-else-if="activeTab === 'templates'" />
      <SectionPalette v-else-if="activeTab === 'sections'" />
      <div v-else class="effects-placeholder">
        <p class="placeholder-text">
          Effets à venir...
        </p>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.left-sidebar {
  width: 280px;
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  height: 56px; /* Explicit alignment height */
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
  color: white;
  background-color: var(--color-primary);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.effects-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.placeholder-text {
  color: var(--color-text-muted);
  font-style: italic;
}
</style>
