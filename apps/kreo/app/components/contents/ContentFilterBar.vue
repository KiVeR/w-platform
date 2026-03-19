<script setup lang="ts">
import type { ContentType } from '#shared/types/content'
import { CONTENT_TYPE_EMOJI, CONTENT_TYPE_LABELS, CONTENT_TYPES } from '#shared/types/content'
import { Search, X } from 'lucide-vue-next'

defineProps<{
  selectedType: ContentType | undefined
  searchQuery: string
}>()

const emit = defineEmits<{
  'update:selectedType': [type: ContentType | undefined]
  'update:searchQuery': [query: string]
}>()

const searchInput = ref<HTMLInputElement | null>(null)

function selectType(type: ContentType | undefined) {
  emit('update:selectedType', type)
}

function updateSearch(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:searchQuery', target.value)
}

function clearSearch() {
  emit('update:searchQuery', '')
  searchInput.value?.focus()
}

// Focus search with / key
function handleKeydown(event: KeyboardEvent) {
  if (event.key === '/' && document.activeElement !== searchInput.value) {
    event.preventDefault()
    searchInput.value?.focus()
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
  <div class="filter-bar">
    <div class="type-filters" role="group" aria-label="Filtrer par type de contenu">
      <button
        class="filter-btn"
        :class="{ active: !selectedType }"
        :aria-pressed="!selectedType"
        @click="selectType(undefined)"
      >
        Tous
      </button>
      <button
        v-for="type in CONTENT_TYPES"
        :key="type"
        class="filter-btn"
        :class="{ active: selectedType === type }"
        :aria-pressed="selectedType === type"
        @click="selectType(type)"
      >
        <span class="filter-emoji" aria-hidden="true">{{ CONTENT_TYPE_EMOJI[type] }}</span>
        <span class="filter-label">{{ CONTENT_TYPE_LABELS[type] }}</span>
        <span class="visually-hidden">{{ CONTENT_TYPE_LABELS[type] }}</span>
      </button>
    </div>

    <div class="search-box">
      <Search :size="16" class="search-icon" aria-hidden="true" />
      <label for="content-search" class="visually-hidden">Rechercher des contenus</label>
      <input
        id="content-search"
        ref="searchInput"
        type="search"
        :value="searchQuery"
        placeholder="Rechercher... (/)"
        class="search-input"
        aria-describedby="search-shortcut"
        @input="updateSearch"
      >
      <span id="search-shortcut" class="visually-hidden">Appuyez sur / pour rechercher</span>
      <button
        v-if="searchQuery"
        class="clear-btn"
        aria-label="Effacer la recherche"
        @click="clearSearch"
      >
        <X :size="14" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.type-filters {
  display: flex;
  gap: var(--space-2);
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-btn:hover {
  background-color: var(--color-background);
  border-color: var(--color-text-muted);
}

.filter-btn.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.filter-emoji {
  font-size: var(--text-base);
}

.filter-label {
  display: none;
}

@media (min-width: 768px) {
  .filter-label {
    display: inline;
  }
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 200px;
  max-width: 300px;
  flex: 1;
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
  padding-left: calc(var(--space-3) + 16px + var(--space-2));
  padding-right: var(--space-8);
  font-size: var(--text-sm);
  color: var(--color-text);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  outline: none;
  transition: all var(--transition-fast);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input:focus {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.clear-btn {
  position: absolute;
  right: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  background-color: var(--color-background);
  color: var(--color-text);
}

.filter-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.clear-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Visually hidden but accessible to screen readers */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
