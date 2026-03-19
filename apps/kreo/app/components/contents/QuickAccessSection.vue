<script setup lang="ts">
import type { ContentListItem } from '#shared/types/content'
import { ChevronRight, Clock, Star } from 'lucide-vue-next'
import ContentCard from './ContentCard.vue'

defineProps<{
  recentItems: ContentListItem[]
  favoriteItems: ContentListItem[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  toggleFavorite: [content: ContentListItem]
}>()

function handleToggleFavorite(content: ContentListItem) {
  emit('toggleFavorite', content)
}
</script>

<template>
  <div class="quick-access">
    <!-- Favorites section -->
    <section v-if="favoriteItems.length > 0" class="quick-section" aria-labelledby="favorites-heading">
      <div class="section-header">
        <h2 id="favorites-heading" class="section-title">
          <Star :size="16" class="section-icon" aria-hidden="true" />
          <span>Favoris</span>
        </h2>
      </div>
      <div class="cards-row">
        <ContentCard
          v-for="content in favoriteItems"
          :key="content.id"
          :content="content"
          compact
          @toggle-favorite="handleToggleFavorite"
        />
      </div>
    </section>

    <!-- Recent section -->
    <section v-if="recentItems.length > 0" class="quick-section" aria-labelledby="recent-heading">
      <div class="section-header">
        <h2 id="recent-heading" class="section-title">
          <Clock :size="16" class="section-icon" aria-hidden="true" />
          <span>Récents</span>
        </h2>
        <NuxtLink
          v-if="recentItems.length >= 4"
          to="/dashboard?view=all"
          class="see-all-link"
          aria-label="Voir tous les contenus récents"
        >
          Voir tout
          <ChevronRight :size="14" aria-hidden="true" />
        </NuxtLink>
      </div>
      <div class="cards-row">
        <ContentCard
          v-for="content in recentItems.slice(0, 4)"
          :key="content.id"
          :content="content"
          compact
          @toggle-favorite="handleToggleFavorite"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.quick-access {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.quick-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.section-icon {
  color: var(--color-text-muted);
}

.see-all-link {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.see-all-link:hover {
  color: var(--color-primary-dark);
}

.see-all-link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.cards-row {
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
  padding-bottom: var(--space-2);
  scrollbar-width: thin;
}

.cards-row::-webkit-scrollbar {
  height: 4px;
}

.cards-row::-webkit-scrollbar-track {
  background: var(--color-background);
  border-radius: 2px;
}

.cards-row::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 2px;
}

.cards-row::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}
</style>
