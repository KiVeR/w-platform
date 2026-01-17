<script setup lang="ts">
import type { TemplateCategory, TemplatePreset } from '@/types/preset'
import { Search, X } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { usePresetsStore } from '@/stores/presets'
import ApplyTemplateModal from './ApplyTemplateModal.vue'
import TemplateCard from './TemplateCard.vue'

const presetsStore = usePresetsStore()

// Search state
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement>()

// Category filter state
const selectedCategory = ref<TemplateCategory | ''>('')

// Computed filtered templates
const filteredTemplates = computed(() => {
  return presetsStore.filterTemplates(
    searchQuery.value,
    selectedCategory.value || undefined,
  )
})

// Results count text
const resultsText = computed(() => {
  const count = filteredTemplates.value.length
  if (count === 0)
    return 'Aucun template trouvé'
  if (count === 1)
    return '1 template'
  return `${count} templates`
})

// Clear search
function clearSearch() {
  searchQuery.value = ''
  searchInputRef.value?.focus()
}

// Handle apply template
function handleApplyTemplate(template: TemplatePreset) {
  presetsStore.openApplyModal(template)
}

// Keyboard shortcut for search focus
function handleKeydown(event: KeyboardEvent) {
  if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
    event.preventDefault()
    searchInputRef.value?.focus()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="template-palette">
    <!-- Search bar -->
    <div class="palette-search">
      <div class="search-input-wrapper">
        <Search class="search-icon" :size="16" />
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un template..."
          class="search-input"
          aria-label="Rechercher un template"
        >
        <button
          v-if="searchQuery"
          class="clear-button"
          aria-label="Effacer la recherche"
          @click="clearSearch"
        >
          <X :size="14" />
        </button>
        <span v-else class="search-shortcut" aria-hidden="true">/</span>
      </div>
    </div>

    <!-- Category filter -->
    <div class="category-filter">
      <button
        class="category-chip"
        :class="{ active: selectedCategory === '' }"
        @click="selectedCategory = ''"
      >
        Tous
      </button>
      <button
        v-for="category in presetsStore.templateCategoryList"
        :key="category.id"
        class="category-chip"
        :class="{ active: selectedCategory === category.id }"
        @click="selectedCategory = category.id"
      >
        {{ category.label }}
      </button>
    </div>

    <!-- Results count -->
    <div class="results-info">
      {{ resultsText }}
    </div>

    <!-- Templates grid -->
    <div class="template-grid">
      <TemplateCard
        v-for="template in filteredTemplates"
        :key="template.id"
        :template="template"
        @apply="handleApplyTemplate"
      />
    </div>

    <!-- Empty state -->
    <div v-if="filteredTemplates.length === 0" class="empty-state">
      <p>Aucun template ne correspond à votre recherche.</p>
    </div>

    <!-- Apply modal -->
    <ApplyTemplateModal
      v-if="presetsStore.selectedTemplate"
      :template="presetsStore.selectedTemplate"
      :is-open="presetsStore.isApplyModalOpen"
      @confirm="presetsStore.applyTemplate(presetsStore.selectedTemplate!)"
      @cancel="presetsStore.closeApplyModal"
    />
  </div>
</template>

<style scoped>
.template-palette {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Search */
.palette-search {
  position: relative;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: var(--space-3);
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  padding-left: 36px;
  padding-right: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background-color: var(--color-surface);
  color: var(--color-text);
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.clear-button {
  position: absolute;
  right: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.clear-button:hover {
  background-color: var(--color-neutral-100);
  color: var(--color-text);
}

.search-shortcut {
  position: absolute;
  right: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  background-color: var(--color-neutral-100);
  border-radius: var(--radius-sm);
}

/* Category filter */
.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.category-chip {
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.category-chip:hover {
  border-color: var(--color-primary-400);
  color: var(--color-text);
}

.category-chip.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* Results info */
.results-info {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

/* Template grid */
.template-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: var(--space-6) var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
</style>
