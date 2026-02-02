<script setup lang="ts">
import type { ContentListItem } from '#shared/types/content'
import { STATUS_COLORS, STATUS_LABELS } from '#shared/constants/status'
import { CONTENT_TYPE_EMOJI, CONTENT_TYPE_LABELS, isEditorAvailable } from '#shared/types/content'
import { getContentTypeSlug } from '#shared/utils/content'
import { Star, Trash2 } from 'lucide-vue-next'
import { formatRelativeTime } from '@/utils/formatters'

const props = defineProps<{
  content: ContentListItem
  compact?: boolean
}>()

const emit = defineEmits<{
  click: [content: ContentListItem]
  delete: [content: ContentListItem]
  toggleFavorite: [content: ContentListItem]
}>()

const canEdit = computed(() => isEditorAvailable(props.content.type))

function getEditUrl(): string {
  return `/${getContentTypeSlug(props.content.type)}/${props.content.id}`
}

function handleClick() {
  emit('click', props.content)
}

function handleDelete(e: Event) {
  e.stopPropagation()
  e.preventDefault()
  emit('delete', props.content)
}

function handleToggleFavorite(e: Event) {
  e.stopPropagation()
  e.preventDefault()
  emit('toggleFavorite', props.content)
}
</script>

<template>
  <!-- Compact mode for Quick Access section -->
  <div v-if="compact" class="content-card-compact-wrapper">
    <NuxtLink
      :to="getEditUrl()"
      class="content-card-compact"
      :aria-label="`Modifier ${content.title}`"
    >
      <span class="content-icon" aria-hidden="true">{{ CONTENT_TYPE_EMOJI[content.type] }}</span>
      <div class="content-info">
        <span class="content-title" :title="content.title">{{ content.title }}</span>
        <span class="content-meta">{{ formatRelativeTime(content.updatedAt) }}</span>
      </div>
    </NuxtLink>
    <button
      class="favorite-btn favorite-btn--compact"
      :class="{ 'is-favorite': content.isFavorite }"
      :aria-label="content.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
      :aria-pressed="content.isFavorite"
      @click="handleToggleFavorite"
    >
      <Star :size="14" :fill="content.isFavorite ? 'currentColor' : 'none'" aria-hidden="true" />
    </button>
  </div>

  <!-- Full mode for content list -->
  <article
    v-else
    class="content-card"
    :class="{ 'content-card--unavailable': !canEdit }"
  >
    <NuxtLink
      :to="getEditUrl()"
      class="content-card-link"
      :aria-label="`Modifier ${content.title}`"
      @click="handleClick"
    >
      <div class="content-left">
        <button
          class="favorite-btn"
          :class="{ 'is-favorite': content.isFavorite }"
          :aria-label="content.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
          :aria-pressed="content.isFavorite"
          @click="handleToggleFavorite"
        >
          <Star :size="16" :fill="content.isFavorite ? 'currentColor' : 'none'" aria-hidden="true" />
        </button>
        <span class="content-icon" aria-hidden="true">{{ CONTENT_TYPE_EMOJI[content.type] }}</span>
        <div class="content-details">
          <h3 class="content-title">
            {{ content.title }}
          </h3>
          <span class="content-type">{{ CONTENT_TYPE_LABELS[content.type] }}</span>
        </div>
      </div>
      <div class="content-right">
        <span v-if="!canEdit" class="editor-badge">Éditeur à venir</span>
        <span v-else class="status-badge" :class="[STATUS_COLORS[content.status]]">
          {{ STATUS_LABELS[content.status] }}
        </span>
        <span class="updated-at">{{ formatRelativeTime(content.updatedAt) }}</span>
      </div>
    </NuxtLink>
    <button
      class="delete-btn"
      :aria-label="`Supprimer ${content.title}`"
      @click="handleDelete"
    >
      <Trash2 :size="16" aria-hidden="true" />
    </button>
  </article>
</template>

<style scoped>
/* Compact card wrapper to separate link and button */
.content-card-compact-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 160px;
  max-width: 240px;
}

/* Compact card for quick access */
.content-card-compact {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  padding-right: var(--space-8);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all var(--transition-fast);
  flex: 1;
}

.content-card-compact:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.content-card-compact:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.content-card-compact .content-icon {
  font-size: var(--text-xl);
  flex-shrink: 0;
}

.content-card-compact .content-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.content-card-compact .content-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  text-overflow: ellipsis;
}

.content-card-compact .content-meta {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

/* Full card for content list */
.content-card {
  display: flex;
  align-items: center;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.content-card:hover {
  border-color: var(--color-primary-light);
}

.content-card--unavailable {
  opacity: 0.7;
  background-color: var(--color-background);
}

.content-card--unavailable:hover {
  border-color: var(--color-border);
}

.content-card-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  padding: var(--space-4);
  text-decoration: none;
  color: inherit;
}

.content-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.content-icon {
  font-size: var(--text-xl);
  flex-shrink: 0;
}

.content-details {
  min-width: 0;
}

.content-title {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content-type {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.content-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.editor-badge {
  padding: 2px 8px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-warning-700);
  background-color: var(--color-warning-100);
  border-radius: var(--radius-sm);
}

.status-badge {
  padding: 2px 8px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-sm);
}

.updated-at {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* Favorite button */
.favorite-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.favorite-btn:hover {
  color: var(--color-warning-500);
  background-color: var(--color-warning-50);
}

.favorite-btn.is-favorite {
  color: var(--color-warning-500);
}

.favorite-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Compact favorite button positioning */
.favorite-btn--compact {
  position: absolute;
  right: var(--space-2);
  top: 50%;
  transform: translateY(-50%);
}

/* Delete button */
.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-right: var(--space-3);
  padding: 0;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);
}

.content-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--color-error);
  background-color: var(--color-error-50);
}

.delete-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  opacity: 1;
}

.content-card-link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
  border-radius: var(--radius-md);
}
</style>
