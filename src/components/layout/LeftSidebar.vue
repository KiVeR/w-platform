<script setup lang="ts">
import type { Component } from 'vue'
import { FileStack, LayoutGrid, Rows3, Search, Sparkles, X } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

type Tab = 'widgets' | 'templates' | 'sections' | 'effects'

interface NavItem {
  id: Tab
  label: string
  icon: Component
  shortcut: string
  hasSearch: boolean
}

const activeTab = ref<Tab>('widgets')
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

const mainNavItems: NavItem[] = [
  { id: 'widgets', label: 'Widgets', icon: LayoutGrid, shortcut: '1', hasSearch: true },
  { id: 'templates', label: 'Modèles', icon: FileStack, shortcut: '2', hasSearch: true },
  { id: 'sections', label: 'Sections', icon: Rows3, shortcut: '3', hasSearch: false },
  { id: 'effects', label: 'Effets', icon: Sparkles, shortcut: '4', hasSearch: false },
]

const currentNavItem = computed(() =>
  mainNavItems.find(item => item.id === activeTab.value),
)

const currentTabHasSearch = computed(() => currentNavItem.value?.hasSearch ?? false)

// Clear search when changing tabs
watch(activeTab, () => {
  searchQuery.value = ''
})

function clearSearch() {
  searchQuery.value = ''
  searchInputRef.value?.focus()
}

function focusSearch() {
  searchInputRef.value?.focus()
}

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
  // Cmd+1/2/3/4 for tab switching
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
    const num = Number.parseInt(e.key)
    if (num >= 1 && num <= mainNavItems.length) {
      e.preventDefault()
      activeTab.value = mainNavItems[num - 1].id
    }
  }

  // "/" for search focus (only if current tab has search)
  if (e.key === '/' && currentTabHasSearch.value && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
    e.preventDefault()
    focusSearch()
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
          <span class="rail-tooltip">
            {{ item.label }}
            <kbd class="tooltip-shortcut">⌘{{ item.shortcut }}</kbd>
          </span>
        </button>
      </div>
    </nav>

    <div class="sidebar-panel">
      <header class="panel-header">
        <div v-if="currentTabHasSearch" class="panel-search">
          <Search :size="14" class="search-icon" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="search"
            class="search-input"
            placeholder="Rechercher..."
            :aria-label="`Rechercher dans ${currentNavItem?.label}`"
          >
          <button
            v-if="searchQuery"
            class="search-clear"
            aria-label="Effacer la recherche"
            @click="clearSearch"
          >
            <X :size="12" />
          </button>
          <kbd v-else class="search-shortcut">/</kbd>
        </div>
        <h2 v-else class="panel-title">
          {{ currentNavItem?.label }}
        </h2>
      </header>

      <div class="panel-content">
        <WidgetPalette v-if="activeTab === 'widgets'" :search-query="searchQuery" />
        <TemplatePalette v-else-if="activeTab === 'templates'" :search-query="searchQuery" />
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

.tooltip-shortcut {
  margin-left: 8px;
  padding: 2px 5px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  font-size: 10px;
  font-family: var(--font-mono, ui-monospace, monospace);
  opacity: 0.8;
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

/* Panel Search */
.panel-search {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.panel-search .search-icon {
  position: absolute;
  left: 10px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.panel-search .search-input {
  width: 100%;
  height: 32px;
  padding: 0 32px 0 30px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: var(--color-surface);
  color: var(--color-text);
  transition: all var(--transition-fast);
}

.panel-search .search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.panel-search .search-input::placeholder {
  color: var(--color-text-muted);
}

.panel-search .search-clear {
  position: absolute;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: var(--color-neutral-100);
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.panel-search .search-clear:hover {
  background: var(--color-neutral-200);
  color: var(--color-text);
}

.panel-search .search-shortcut {
  position: absolute;
  right: 8px;
  padding: 2px 6px;
  background: var(--color-neutral-100);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
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
