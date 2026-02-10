<script setup lang="ts">
import { Search } from 'lucide-vue-next'

const props = defineProps<{
  searchQuery?: string
}>()

const activeFilter = ref<WidgetCategory | 'all'>('all')

// Widgets disponibles dans la palette (column exclu — créé uniquement via le "+" dans un row)
const paletteWidgets = computed(() =>
  widgetConfigs.filter(w => w.type !== 'column'),
)

// Filtrer les widgets par recherche ET par filtre de catégorie
const filteredWidgets = computed(() => {
  let widgets = paletteWidgets.value

  // Filtrer par catégorie si un filtre est actif
  if (activeFilter.value !== 'all') {
    widgets = widgets.filter(w => w.category === activeFilter.value)
  }

  // Filtrer par recherche si une requête est présente
  const query = props.searchQuery?.trim().toLowerCase()
  if (query) {
    widgets = widgets.filter(w =>
      w.label.toLowerCase().includes(query)
      || w.type.toLowerCase().includes(query),
    )
  }

  return widgets
})

// Compter les widgets par catégorie
const categoryCounts = computed(() => {
  const all = paletteWidgets.value
  const counts: Record<string, number> = { all: all.length }
  widgetCategories.forEach((cat) => {
    counts[cat.id] = all.filter(w => w.category === cat.id).length
  })
  return counts
})

function setFilter(category: WidgetCategory | 'all') {
  activeFilter.value = category
}

// Reset filter quand on recherche
watch(() => props.searchQuery, (query) => {
  if (query?.trim()) {
    activeFilter.value = 'all'
  }
})
</script>

<template>
  <div class="widget-palette">
    <!-- Filtres par catégorie (tags horizontaux) -->
    <div class="category-filters">
      <button
        class="filter-tag"
        :class="{ active: activeFilter === 'all' }"
        @click="setFilter('all')"
      >
        Tous
        <span class="filter-count">{{ categoryCounts.all }}</span>
      </button>
      <button
        v-for="category in widgetCategories"
        :key="category.id"
        class="filter-tag"
        :class="{ active: activeFilter === category.id }"
        @click="setFilter(category.id)"
      >
        {{ category.label }}
        <span class="filter-count">{{ categoryCounts[category.id] }}</span>
      </button>
    </div>

    <!-- Grille de widgets filtrés -->
    <div class="widgets-section">
      <p v-if="searchQuery" class="results-count">
        {{ filteredWidgets.length }} widget{{ filteredWidgets.length > 1 ? 's' : '' }} trouvé{{ filteredWidgets.length > 1 ? 's' : '' }}
      </p>

      <div v-if="filteredWidgets.length === 0" class="empty-state">
        <Search :size="32" class="empty-icon" />
        <p>Aucun widget trouvé</p>
      </div>

      <div v-else class="widget-grid">
        <WidgetItem
          v-for="config in filteredWidgets"
          :key="config.type"
          :config="config"
        />
      </div>
    </div>

    <!-- Slot for app-level extensions (e.g., AI assistant button) -->
    <slot name="footer" />
  </div>
</template>

<style scoped>
.widget-palette {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  height: 100%;
}

/* Category Filters */
.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  flex-shrink: 0;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.filter-tag:hover {
  border-color: var(--color-primary-300);
  background: var(--color-primary-50);
}

.filter-tag.active {
  border-color: var(--color-primary-500);
  background: var(--color-primary-500);
  color: var(--color-surface);
}

.filter-tag.active .filter-count {
  background: color-mix(in srgb, var(--color-surface) 20%, transparent);
  color: var(--color-surface);
}

.filter-count {
  font-size: 10px;
  padding: 1px 5px;
  background: var(--color-neutral-100);
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
}

/* Widgets Section */
.widgets-section {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.results-count {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-2) 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
  text-align: center;
}

.empty-icon {
  opacity: 0.3;
  margin-bottom: var(--space-2);
}

.widget-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}
</style>
