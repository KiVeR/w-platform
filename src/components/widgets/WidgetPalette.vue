<script setup lang="ts">
import type { WidgetCategory } from '@/types/widget'
import { Search, Sparkles } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import AIChatPanel from '@/components/ai/AIChatPanel.vue'
import { getWidgetsByCategory, widgetCategories, widgetConfigs } from '@/config/widgets'
import { useAIChatStore } from '@/stores/aiChat'
import WidgetItem from './WidgetItem.vue'

const props = defineProps<{
  searchQuery?: string
}>()

const aiChatStore = useAIChatStore()

const activeFilter = ref<WidgetCategory | 'all'>('all')

// Filtrer les widgets par recherche ET par filtre de catégorie
const filteredWidgets = computed(() => {
  let widgets = widgetConfigs

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
  const counts: Record<string, number> = { all: widgetConfigs.length }
  widgetCategories.forEach((cat) => {
    counts[cat.id] = getWidgetsByCategory(cat.id).length
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

    <!-- Bouton IA -->
    <button
      class="ai-assistant-btn"
      title="Ouvrir l'assistant IA"
      @click="aiChatStore.open()"
    >
      <Sparkles :size="16" />
      <span>Aide-moi à créer...</span>
    </button>

    <!-- AI Chat Panel -->
    <AIChatPanel />
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
  color: white;
}

.filter-tag.active .filter-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
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

/* AI Assistant Button */
.ai-assistant-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px dashed var(--color-primary-300);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--color-primary-50) 0%, #fef3c7 100%);
  font-size: var(--text-sm);
  color: var(--color-primary-600);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ai-assistant-btn:hover {
  border-color: var(--color-primary-500);
  background: linear-gradient(135deg, var(--color-primary-100) 0%, #fde68a 100%);
  color: var(--color-primary-700);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}
</style>
