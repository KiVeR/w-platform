<script setup lang="ts">
import type { Component } from 'vue'
import { FileStack, LayoutGrid, Rows3, Sparkles } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import KreoLogo from '@/components/icons/KreoLogo.vue'
import SectionPalette from '@/components/templates/SectionPalette.vue'
import TemplatePalette from '@/components/templates/TemplatePalette.vue'
import WidgetPalette from '@/components/widgets/WidgetPalette.vue'

type Tab = 'widgets' | 'templates' | 'sections' | 'effects'

interface NavItem {
  id: Tab
  label: string
  icon: Component
  shortcut: string
}

const activeTab = ref<Tab>('widgets')

const mainNavItems: NavItem[] = [
  { id: 'widgets', label: 'Widgets', icon: LayoutGrid, shortcut: '1' },
  { id: 'templates', label: 'Modèles', icon: FileStack, shortcut: '2' },
  { id: 'sections', label: 'Sections', icon: Rows3, shortcut: '3' },
  { id: 'effects', label: 'Effets', icon: Sparkles, shortcut: '4' },
]

const currentNavItem = computed(() =>
  mainNavItems.find(item => item.id === activeTab.value),
)

function handleNavKeydown(e: KeyboardEvent, index: number) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeTab.value = mainNavItems[(index + 1) % mainNavItems.length].id
      break
    case 'ArrowUp':
      e.preventDefault()
      activeTab.value = mainNavItems[(index - 1 + mainNavItems.length) % mainNavItems.length].id
      break
    case 'Home':
      e.preventDefault()
      activeTab.value = mainNavItems[0].id
      break
    case 'End':
      e.preventDefault()
      activeTab.value = mainNavItems[mainNavItems.length - 1].id
      break
  }
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
    const num = Number.parseInt(e.key)
    if (num >= 1 && num <= mainNavItems.length) {
      e.preventDefault()
      activeTab.value = mainNavItems[num - 1].id
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <aside class="left-sidebar">
    <nav
      class="sidebar-rail"
      role="tablist"
      aria-label="Panneau de contenu"
      aria-orientation="vertical"
    >
      <NuxtLink to="/dashboard" class="rail-logo" aria-label="Retour au dashboard">
        <KreoLogo :size="28" />
      </NuxtLink>
      <div class="rail-separator" />

      <!-- Main navigation tabs -->
      <div class="rail-main">
        <button
          v-for="(item, index) in mainNavItems"
          :key="item.id"
          class="rail-btn"
          role="tab"
          :class="{ active: activeTab === item.id }"
          :aria-selected="activeTab === item.id"
          :aria-label="`${item.label} (⌘${item.shortcut})`"
          :tabindex="activeTab === item.id ? 0 : -1"
          @click="activeTab = item.id"
          @keydown="(e) => handleNavKeydown(e, index)"
        >
          <component :is="item.icon" :size="20" />
          <span class="rail-tooltip">{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <div class="sidebar-panel">
      <header class="panel-header">
        <h2 class="panel-title">
          {{ currentNavItem?.label }}
        </h2>
      </header>

      <div class="panel-content">
        <WidgetPalette v-if="activeTab === 'widgets'" />
        <TemplatePalette v-else-if="activeTab === 'templates'" />
        <SectionPalette v-else-if="activeTab === 'sections'" />
        <div v-else class="effects-placeholder">
          <p class="placeholder-text">
            Effets à venir...
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.left-sidebar {
  display: flex;
  flex-shrink: 0;
  height: 100%;
}

/* Icon Rail */
.sidebar-rail {
  width: var(--sidebar-rail-width);
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  gap: 4px;
}

.rail-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--sidebar-rail-width);
  height: 40px;
  transition: opacity 0.15s ease;
}

.rail-logo:hover {
  opacity: 0.8;
}

.rail-separator {
  height: 1px;
  margin: 4px 12px 8px;
  background-color: var(--color-border);
}

.rail-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rail-btn {
  position: relative;
  width: var(--sidebar-rail-width);
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
  outline: none;
}

.rail-btn::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background-color: var(--color-primary);
  border-radius: 0 2px 2px 0;
  transition: height 0.15s ease;
}

.rail-btn:hover {
  color: var(--color-text);
  background-color: var(--color-surface-hover);
}

.rail-btn.active {
  color: var(--color-primary);
}

.rail-btn.active::before {
  height: 24px;
}

.rail-btn:focus-visible {
  box-shadow: inset 0 0 0 2px var(--color-primary-300, rgba(20, 184, 166, 0.4));
}

/* Tooltip */
.rail-tooltip {
  position: absolute;
  left: calc(100% + 8px);
  padding: 6px 10px;
  background-color: var(--color-neutral-800, #1e293b);
  color: var(--color-text-inverse, #fff);
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.15s ease,
    visibility 0.15s ease;
  z-index: 100;
  pointer-events: none;
}

.rail-tooltip::before {
  content: '';
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 4px solid transparent;
  border-right-color: var(--color-neutral-800, #1e293b);
}

.rail-btn:hover .rail-tooltip,
.rail-btn:focus-visible .rail-tooltip {
  opacity: 1;
  visibility: visible;
}

/* Content Panel */
.sidebar-panel {
  width: var(--sidebar-width);
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.panel-header {
  height: var(--header-height);
  padding: 0 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.panel-content {
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
  font-size: 13px;
}
</style>
