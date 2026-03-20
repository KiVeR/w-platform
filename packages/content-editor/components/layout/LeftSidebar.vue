<script setup lang="ts">
import type { Component } from 'vue'
import { FileStack, LayoutGrid, PanelLeftClose, Rows3, Search, X } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

type Tab = 'widgets' | 'templates' | 'sections'

interface NavItem {
  id: Tab
  label: string
  icon: Component
  shortcut: string
}

const props = withDefaults(defineProps<{
  homePath?: string | null
  homeAriaLabel?: string
}>(), {
  homePath: null,
  homeAriaLabel: 'Accueil éditeur',
})

const editorConfig = useEditorConfig()
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

const mainNavItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    { id: 'widgets', label: 'Widgets', icon: LayoutGrid, shortcut: '1' },
  ]

  if (editorConfig.features?.templates !== false) {
    items.push({ id: 'templates', label: 'Modèles', icon: FileStack, shortcut: '2' })
  }

  items.push({ id: 'sections', label: 'Sections', icon: Rows3, shortcut: String(items.length + 1) })
  return items
})

const activeTab = ref<Tab>('widgets')
const currentNavItem = computed(() =>
  mainNavItems.value.find(item => item.id === activeTab.value) ?? mainNavItems.value[0],
)
const logo = computed(() => editorConfig.theme?.logo)

watch(mainNavItems, (items) => {
  if (!items.some(item => item.id === activeTab.value))
    activeTab.value = items[0]?.id ?? 'widgets'
}, { immediate: true })

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
  const items = mainNavItems.value
  if (items.length === 0)
    return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeTab.value = items[(index + 1) % items.length]?.id ?? activeTab.value
      break
    case 'ArrowUp':
      e.preventDefault()
      activeTab.value = items[(index - 1 + items.length) % items.length]?.id ?? activeTab.value
      break
    case 'Home':
      e.preventDefault()
      activeTab.value = items[0]?.id ?? activeTab.value
      break
    case 'End':
      e.preventDefault()
      activeTab.value = items[items.length - 1]?.id ?? activeTab.value
      break
  }
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
    const num = Number.parseInt(e.key)
    if (Number.isNaN(num))
      return

    const item = mainNavItems.value[num - 1]
    if (item) {
      e.preventDefault()
      activeTab.value = item.id
    }
  }

  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
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

function handleRailKeydown(event: KeyboardEvent, index: number) {
  handleNavKeydown(event, index)
}
</script>

<template>
  <aside class="left-sidebar">
    <nav
      class="sidebar-rail"
      role="tablist"
      aria-label="Panneau de contenu"
      aria-orientation="vertical"
    >
      <NuxtLink
        v-if="props.homePath"
        :to="props.homePath"
        class="rail-logo"
        :aria-label="props.homeAriaLabel"
      >
        <img
          v-if="logo?.src"
          :src="logo.src"
          :alt="logo.alt || props.homeAriaLabel"
          :style="{ height: `${logo.height ?? 28}px` }"
        >
        <PanelLeftClose v-else :size="20" />
      </NuxtLink>
      <div v-if="props.homePath" class="rail-separator" />

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
          @keydown="handleRailKeydown($event, index)"
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
        <div class="panel-search">
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
      </header>

      <div class="panel-content">
        <WidgetPalette v-if="activeTab === 'widgets'" :search-query="searchQuery" />
        <TemplatePalette v-else-if="activeTab === 'templates'" :search-query="searchQuery" />
        <SectionPalette v-else-if="activeTab === 'sections'" :search-query="searchQuery" />
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
  color: var(--color-text-muted);
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
  margin-left: 6px;
  opacity: 0.7;
  font-family: var(--font-mono);
}

.sidebar-panel {
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
}

.panel-header {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
}

.panel-search {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--color-text-muted);
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 32px 0 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-background);
  color: var(--color-text);
}

.search-input:focus {
  outline: none;
  box-shadow: var(--focus-ring);
}

.search-clear,
.search-shortcut {
  position: absolute;
  right: 10px;
  color: var(--color-text-muted);
}

.search-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
}

.search-shortcut {
  font-family: var(--font-mono);
  font-size: 11px;
}

.panel-content {
  flex: 1;
  min-height: 0;
}
</style>
