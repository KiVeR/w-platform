<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  searchQuery?: string
}>()

const presetsStore = usePresetsStore()

const selectedCategory = ref<SectionCategory | ''>('')

const filteredSections = computed(() => {
  return presetsStore.filterSections(
    props.searchQuery || '',
    selectedCategory.value || undefined,
  )
})

watch(() => props.searchQuery, (query) => {
  if (query?.trim()) {
    selectedCategory.value = ''
  }
})

const resultsText = computed(() => {
  const count = filteredSections.value.length
  if (count === 0)
    return 'Aucune section trouvée'
  if (count === 1)
    return '1 section'
  return `${count} sections`
})
</script>

<template>
  <div class="section-palette">
    <div class="category-filter">
      <button
        class="category-chip"
        :class="{ active: selectedCategory === '' }"
        @click="selectedCategory = ''"
      >
        Tous
      </button>
      <button
        v-for="category in presetsStore.sectionCategoryList"
        :key="category.id"
        class="category-chip"
        :class="{ active: selectedCategory === category.id }"
        @click="selectedCategory = category.id"
      >
        {{ category.label }}
      </button>
    </div>

    <div class="results-info">
      {{ resultsText }}
    </div>

    <div class="section-list">
      <SectionItem
        v-for="section in filteredSections"
        :key="section.id"
        :section="section"
      />
    </div>

    <div v-if="filteredSections.length === 0" class="empty-state">
      <p>Aucune section ne correspond à votre recherche.</p>
    </div>
  </div>
</template>

<style scoped>
.section-palette {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

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

.results-info {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.empty-state {
  text-align: center;
  padding: var(--space-6) var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
</style>
