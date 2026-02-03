<script setup lang="ts">
import type { Component } from 'vue'
import { ICON_CATEGORIES, POPULAR_ICONS } from '#shared/constants/lucide-categories'
import { ChevronDown, Search, Star, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { getLucideIcon, searchIcons } from '@/utils/lucide-icons'

defineProps<{
  modelValue?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isExpanded = ref(false)
const searchQuery = ref('')
const activeCategory = ref<string | null>(null)
const showCategoryMenu = ref(false)
const iconCache = new Map<string, Component | null>()

// All categories including "Populaires"
const allCategories = computed(() => [
  { id: null, label: 'Populaires', count: POPULAR_ICONS.length },
  ...ICON_CATEGORIES.map(cat => ({
    id: cat.id,
    label: cat.label,
    count: cat.icons.length,
  })),
])

// Current category label
const activeCategoryLabel = computed(() => {
  if (activeCategory.value === null)
    return 'Populaires'
  const cat = ICON_CATEGORIES.find(c => c.id === activeCategory.value)
  return cat?.label || 'Populaires'
})

// Search mode detection
const isSearching = computed(() => searchQuery.value.length >= 2)

// Search results when typing
const searchResults = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    return []
  }
  return searchIcons(searchQuery.value, 50)
})

// Icons to display in expanded view
const displayedIcons = computed(() => {
  // Search mode
  if (searchQuery.value.length >= 2) {
    return searchResults.value
  }
  // Category mode
  if (activeCategory.value) {
    const category = ICON_CATEGORIES.find(c => c.id === activeCategory.value)
    return category?.icons || []
  }
  // Default: popular icons
  return [...POPULAR_ICONS]
})

function getCachedIcon(name: string): Component | null {
  if (!iconCache.has(name)) {
    iconCache.set(name, getLucideIcon(name))
  }
  return iconCache.get(name) || null
}

function selectIcon(iconName: string) {
  emit('update:modelValue', iconName)
  isExpanded.value = false
  searchQuery.value = ''
  activeCategory.value = null
  showCategoryMenu.value = false
}

function clearIcon() {
  emit('update:modelValue', '')
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
  if (!isExpanded.value) {
    searchQuery.value = ''
    activeCategory.value = null
    showCategoryMenu.value = false
  }
}

function selectCategory(categoryId: string | null) {
  activeCategory.value = categoryId
  showCategoryMenu.value = false
  searchQuery.value = ''
}

function toggleCategoryMenu() {
  showCategoryMenu.value = !showCategoryMenu.value
}

function clearSearch() {
  searchQuery.value = ''
}

// Reset when closing
watch(isExpanded, (val) => {
  if (!val) {
    searchQuery.value = ''
    activeCategory.value = null
    showCategoryMenu.value = false
  }
})

// Reset category when searching
watch(searchQuery, (val) => {
  if (val.length >= 2) {
    activeCategory.value = null
    showCategoryMenu.value = false
  }
})
</script>

<template>
  <div class="icon-select" @mousedown.stop @click.stop>
    <!-- Current selection / Input -->
    <div class="icon-select-trigger">
      <button
        v-if="modelValue"
        class="selected-icon"
        type="button"
        :title="modelValue"
        @click.stop="toggleExpanded"
      >
        <component
          :is="getCachedIcon(modelValue)"
          v-if="getCachedIcon(modelValue)"
          :size="18"
        />
        <span class="selected-name">{{ modelValue }}</span>
        <ChevronDown :size="14" class="chevron" :class="{ rotated: isExpanded }" />
      </button>
      <button
        v-else
        class="no-icon"
        type="button"
        @click.stop="toggleExpanded"
      >
        {{ placeholder || 'Choisir une icône' }}
        <ChevronDown :size="14" class="chevron" :class="{ rotated: isExpanded }" />
      </button>
      <button
        v-if="modelValue"
        class="clear-btn"
        type="button"
        title="Supprimer l'icône"
        @click.stop="clearIcon"
      >
        <X :size="14" />
      </button>
    </div>

    <!-- Expanded picker -->
    <div v-if="isExpanded" class="icon-picker-dropdown" @mousedown.stop>
      <!-- Search -->
      <div class="search-box">
        <Search :size="14" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher une icône..."
          class="search-input"
          @click.stop
        >
        <button
          v-if="searchQuery"
          class="clear-search"
          type="button"
          @click.stop="clearSearch"
        >
          <X :size="12" />
        </button>
      </div>

      <!-- Category dropdown (hidden during search) -->
      <div v-if="!isSearching" class="category-selector">
        <button
          class="category-dropdown-trigger"
          type="button"
          aria-haspopup="listbox"
          :aria-expanded="showCategoryMenu"
          @click.stop="toggleCategoryMenu"
        >
          <Star v-if="activeCategory === null" :size="14" />
          <span>{{ activeCategoryLabel }}</span>
          <ChevronDown :size="14" class="chevron" :class="{ rotated: showCategoryMenu }" />
        </button>

        <!-- Dropdown menu -->
        <div
          v-if="showCategoryMenu"
          class="category-menu"
          role="listbox"
          aria-label="Catégories d'icônes"
        >
          <button
            v-for="cat in allCategories"
            :key="cat.id ?? 'popular'"
            class="category-menu-item"
            :class="{ active: activeCategory === cat.id }"
            type="button"
            role="option"
            :aria-selected="activeCategory === cat.id"
            @click.stop="selectCategory(cat.id)"
          >
            <span class="category-label">{{ cat.label }}</span>
            <span class="icon-count">{{ cat.count }}</span>
          </button>
        </div>
      </div>

      <!-- Search mode indicator -->
      <div v-else class="search-mode-indicator">
        <Search :size="12" />
        <span>{{ displayedIcons.length }} résultat{{ displayedIcons.length !== 1 ? 's' : '' }}</span>
      </div>

      <!-- Icons grid -->
      <div class="icons-grid">
        <button
          v-for="iconName in displayedIcons"
          :key="iconName"
          class="icon-btn"
          :class="{ selected: modelValue === iconName }"
          type="button"
          :title="iconName"
          @click.stop="selectIcon(iconName)"
        >
          <component
            :is="getCachedIcon(iconName)"
            v-if="getCachedIcon(iconName)"
            :size="20"
          />
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="isSearching && displayedIcons.length === 0" class="empty-state">
        Aucune icône trouvée
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.icon-select-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
}

.selected-icon,
.no-icon {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 0.15s;
  text-align: left;
}

.selected-icon:hover,
.no-icon:hover {
  border-color: var(--color-primary);
}

.no-icon {
  color: var(--color-text-muted);
}

.selected-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: transform 0.15s;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  align-self: stretch;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.clear-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
  border-color: var(--color-border-hover);
}

.icon-picker-dropdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 8px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 6px 28px 6px 28px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  background: var(--color-bg);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.clear-search {
  position: absolute;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.clear-search:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* Category dropdown */
.category-selector {
  position: relative;
}

.category-dropdown-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.category-dropdown-trigger:hover {
  border-color: var(--color-primary);
}

.category-dropdown-trigger span {
  flex: 1;
  text-align: left;
}

.category-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.category-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  background: none;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}

.category-menu-item:hover {
  background: var(--color-bg-hover);
}

.category-menu-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.category-label {
  flex: 1;
}

.icon-count {
  font-size: 10px;
  color: var(--color-text-muted);
  background: var(--color-bg);
  padding: 2px 6px;
  border-radius: var(--radius-full);
}

.category-menu-item.active .icon-count {
  background: var(--color-primary);
  color: white;
}

/* Search mode indicator */
.search-mode-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: var(--color-primary);
}

.icons-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  max-height: 220px;
  overflow-y: auto;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.15s;
}

.icon-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border);
}

.icon-btn.selected {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.empty-state {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
