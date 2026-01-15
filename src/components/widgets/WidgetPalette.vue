<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getWidgetsByCategory, widgetCategories, widgetConfigs } from '@/config/widgets'
import WidgetItem from './WidgetItem.vue'

const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement>()

// Filtrer les widgets par recherche
const filteredWidgets = computed(() => {
  if (!searchQuery.value.trim()) {
    return null
  }
  const query = searchQuery.value.toLowerCase()
  return widgetConfigs.filter(w =>
    w.label.toLowerCase().includes(query)
    || w.type.toLowerCase().includes(query),
  )
})

// Filtrer les catégories (pour n'afficher que celles qui ont des widgets correspondants)
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return widgetCategories
  }
  const query = searchQuery.value.toLowerCase()
  return widgetCategories.filter((category) => {
    const widgets = getWidgetsByCategory(category.id)
    return widgets.some(w =>
      w.label.toLowerCase().includes(query)
      || w.type.toLowerCase().includes(query),
    )
  })
})

function clearSearch() {
  searchQuery.value = ''
  searchInputRef.value?.focus()
}

// Raccourci "/" pour focus sur la recherche
function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
    e.preventDefault()
    searchInputRef.value?.focus()
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
  <div class="widget-palette">
    <!-- Barre de recherche -->
    <div class="palette-search">
      <Search :size="16" class="search-icon" />
      <input
        ref="searchInputRef"
        v-model="searchQuery"
        type="search"
        class="search-input"
        placeholder="Rechercher..."
        aria-label="Rechercher un widget"
      >
      <button
        v-if="searchQuery"
        class="search-clear"
        aria-label="Effacer la recherche"
        @click="clearSearch"
      >
        <X :size="14" />
      </button>
      <kbd v-else class="search-shortcut">/</kbd>
    </div>

    <!-- Résultats de recherche -->
    <template v-if="filteredWidgets">
      <div class="search-results">
        <p class="results-count">
          {{ filteredWidgets.length }} widget{{ filteredWidgets.length > 1 ? 's' : '' }} trouvé{{ filteredWidgets.length > 1 ? 's' : '' }}
        </p>
        <div class="widget-grid">
          <WidgetItem
            v-for="config in filteredWidgets"
            :key="config.type"
            :config="config"
          />
        </div>
      </div>
    </template>

    <!-- Vue par catégories -->
    <template v-else>
      <div
        v-for="category in filteredCategories"
        :key="category.id"
        class="widget-category"
      >
        <h3 class="category-title">
          {{ category.label }}
          <span class="category-count">{{ getWidgetsByCategory(category.id).length }}</span>
        </h3>
        <div class="widget-grid">
          <WidgetItem
            v-for="config in getWidgetsByCategory(category.id)"
            :key="config.type"
            :config="config"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.widget-palette {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Search */
.palette-search {
  position: relative;
  margin-bottom: var(--space-2);
}

.search-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  padding-left: 36px;
  padding-right: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--color-surface);
  transition: all var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: var(--focus-ring);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: var(--color-neutral-100);
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.search-clear:hover {
  background: var(--color-neutral-200);
  color: var(--color-text-primary);
}

.search-shortcut {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  padding: 2px 6px;
  background: var(--color-neutral-100);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
}

/* Results */
.results-count {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-2) 0;
}

.search-results {
  display: flex;
  flex-direction: column;
}

/* Categories */
.widget-category {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.category-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin: 0;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.category-count {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-muted);
  background: var(--color-neutral-100);
  padding: 2px 6px;
  border-radius: var(--radius-full);
}

.widget-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
</style>
