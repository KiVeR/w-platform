<script setup lang="ts">
import type { TemplatePreset } from '@/types/preset'

const props = defineProps<{
  template: TemplatePreset
}>()

const emit = defineEmits<{
  apply: [template: TemplatePreset]
}>()

function handleApply() {
  emit('apply', props.template)
}
</script>

<template>
  <article
    class="template-card"
    role="article"
    :aria-label="`Template ${template.name}`"
  >
    <div class="template-thumbnail">
      <img
        :src="template.thumbnail"
        :alt="`Aperçu du template ${template.name}`"
        loading="lazy"
      >
    </div>

    <div class="template-content">
      <h3 class="template-name">
        {{ template.name }}
      </h3>

      <p class="template-description">
        {{ template.description }}
      </p>

      <div class="template-tags">
        <span
          v-for="tag in template.tags.slice(0, 3)"
          :key="tag"
          class="tag"
        >
          {{ tag }}
        </span>
      </div>

      <button
        class="apply-button"
        aria-label="Appliquer ce template"
        @click="handleApply"
      >
        Appliquer
      </button>
    </div>
  </article>
</template>

<style scoped>
.template-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-400);
}

.template-thumbnail {
  aspect-ratio: 9 / 12;
  overflow: hidden;
  background-color: var(--color-neutral-100);
}

.template-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.template-content {
  padding: var(--space-3);
}

.template-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--space-1) 0;
  line-height: 1.3;
}

.template-description {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-2) 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}

.tag {
  font-size: 10px;
  padding: 2px 6px;
  background-color: var(--color-neutral-100);
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
}

.apply-button {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.apply-button:hover {
  background-color: var(--color-primary-600);
}

.apply-button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
</style>
