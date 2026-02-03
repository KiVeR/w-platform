<script setup lang="ts">
import type { Component } from 'vue'
import { ICON_CATEGORIES, POPULAR_ICONS } from '#shared/constants/lucide-categories'
import { Search, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { getLucideIcon, searchIcons } from '@/utils/lucide-icons'

defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'select': [iconName: string]
}>()

// Cache icon components to avoid repeated lookups
const iconCache = new Map<string, Component | null>()

const searchQuery = ref('')
const activeCategory = ref<string | null>(null)

// Debounced search results
const searchResults = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    return []
  }
  return searchIcons(searchQuery.value, 60)
})

// Icons to display based on current state
const displayedIcons = computed(() => {
  // If searching, show search results
  if (searchQuery.value.length >= 2) {
    return searchResults.value
  }

  // If category selected, show category icons
  if (activeCategory.value) {
    const category = ICON_CATEGORIES.find(c => c.id === activeCategory.value)
    return category?.icons || []
  }

  // Default: show popular icons
  return [...POPULAR_ICONS]
})

const isSearching = computed(() => searchQuery.value.length >= 2)

function selectIcon(iconName: string) {
  emit('update:modelValue', iconName)
  emit('select', iconName)
}

function clearSearch() {
  searchQuery.value = ''
}

function setCategory(categoryId: string | null) {
  activeCategory.value = categoryId
  searchQuery.value = ''
}

// Reset category when searching
watch(searchQuery, (val) => {
  if (val.length >= 2) {
    activeCategory.value = null
  }
})

// Get cached icon component (avoids double lookup in template)
function getCachedIcon(name: string): Component | null {
  if (!iconCache.has(name)) {
    iconCache.set(name, getLucideIcon(name))
  }
  return iconCache.get(name) || null
}
</script>

<template>
  <div class="icon-picker">
    <!-- Search input -->
    <div class="search-container">
      <Search :size="16" class="search-icon" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher une icône..."
        class="search-input"
      >
      <button
        v-if="searchQuery"
        class="clear-button"
        type="button"
        @click="clearSearch"
      >
        <X :size="14" />
      </button>
    </div>

    <!-- Category tabs -->
    <div v-if="!isSearching" class="category-tabs">
      <button
        class="category-tab"
        :class="{ active: activeCategory === null }"
        type="button"
        @click="setCategory(null)"
      >
        Populaires
      </button>
      <button
        v-for="category in ICON_CATEGORIES"
        :key="category.id"
        class="category-tab"
        :class="{ active: activeCategory === category.id }"
        type="button"
        @click="setCategory(category.id)"
      >
        {{ category.label }}
      </button>
    </div>

    <!-- Search results label -->
    <div v-if="isSearching" class="results-label">
      {{ searchResults.length }} résultat{{ searchResults.length !== 1 ? 's' : '' }}
    </div>

    <!-- Icons grid -->
    <div class="icons-grid">
      <button
        v-for="iconName in displayedIcons"
        :key="iconName"
        class="icon-button"
        :class="{ selected: modelValue === iconName }"
        :title="iconName"
        type="button"
        @click="selectIcon(iconName)"
      >
        <component
          :is="getCachedIcon(iconName)"
          v-if="getCachedIcon(iconName)"
          :size="24"
        />
        <span class="icon-name">{{ iconName }}</span>
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="displayedIcons.length === 0 && isSearching" class="empty-state">
      <Search :size="32" class="empty-icon" />
      <p>Aucune icône trouvée</p>
      <p class="empty-hint">
        Essayez un autre terme de recherche
      </p>
    </div>
  </div>
</template>

<style scoped>
.icon-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--color-text-muted, #94a3b8);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 32px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 6px);
  font-size: 13px;
  background: var(--color-bg, #fff);
  color: var(--color-text, #1e293b);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.search-input::placeholder {
  color: var(--color-text-muted, #94a3b8);
}

.clear-button {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: none;
  color: var(--color-text-muted, #94a3b8);
  cursor: pointer;
  border-radius: var(--radius-sm, 4px);
}

.clear-button:hover {
  background: var(--color-bg-hover, #f1f5f9);
  color: var(--color-text, #1e293b);
}

.category-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.category-tab {
  padding: 4px 10px;
  border: none;
  background: none;
  color: var(--color-text-muted, #64748b);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-md, 6px);
  transition: all 0.15s ease;
  white-space: nowrap;
}

.category-tab:hover {
  background: var(--color-bg-hover, #f1f5f9);
  color: var(--color-text, #1e293b);
}

.category-tab.active {
  background: var(--color-primary, #3b82f6);
  color: white;
}

.results-label {
  font-size: 12px;
  color: var(--color-text-muted, #64748b);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.icons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  padding: 4px;
}

.icon-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  border: 1px solid transparent;
  background: var(--color-bg, #fff);
  border-radius: var(--radius-md, 6px);
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--color-text, #1e293b);
}

.icon-button:hover {
  background: var(--color-bg-hover, #f1f5f9);
  border-color: var(--color-border, #e2e8f0);
}

.icon-button.selected {
  background: var(--color-primary-light, #eff6ff);
  border-color: var(--color-primary, #3b82f6);
  color: var(--color-primary, #3b82f6);
}

.icon-name {
  font-size: 10px;
  color: var(--color-text-muted, #64748b);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 100%;
}

.icon-button.selected .icon-name {
  color: var(--color-primary, #3b82f6);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--color-text-muted, #94a3b8);
  text-align: center;
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.empty-state .empty-hint {
  font-size: 12px;
  margin-top: 4px;
}
</style>
