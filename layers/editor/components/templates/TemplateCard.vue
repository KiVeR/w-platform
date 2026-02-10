<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  template: TemplatePreset
  expanded: boolean
}>()

const emit = defineEmits<{
  apply: [template: TemplatePreset]
  toggle: [templateId: string]
}>()

const accentColor = computed(() => {
  const { backgroundColor, textColor } = props.template.globalStyles
  return backgroundColor === '#ffffff' ? textColor : backgroundColor
})

function handleApply(e: Event) {
  e.stopPropagation()
  emit('apply', props.template)
}

function handleToggle() {
  emit('toggle', props.template.id)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handleToggle()
  }
}
</script>

<template>
  <article
    class="template-card"
    :class="{ expanded }"
    role="button"
    tabindex="0"
    :aria-label="`Template ${template.name}`"
    :aria-expanded="expanded"
    @click="handleToggle"
    @keydown="handleKeydown"
  >
    <div class="card-header">
      <div
        class="card-accent"
        :style="{ backgroundColor: accentColor }"
      />

      <div class="card-thumbnail">
        <WidgetBlueprintPreview
          :widgets="template.widgets"
          :background-color="template.globalStyles.backgroundColor"
          :text-color="template.globalStyles.textColor"
          compact
        />
      </div>

      <div class="card-info">
        <h3 class="card-name">
          {{ template.name }}
        </h3>
        <div class="card-tags">
          <span
            v-for="tag in template.tags.slice(0, 2)"
            :key="tag"
            class="card-tag"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <button
        class="card-quick-apply"
        aria-label="Appliquer ce template"
        @click="handleApply"
      >
        Appliquer
      </button>
    </div>

    <div class="card-expand">
      <div class="card-expand-inner" @click.stop>
        <div class="card-preview">
          <WidgetBlueprintPreview
            :widgets="template.widgets"
            :background-color="template.globalStyles.backgroundColor"
            :text-color="template.globalStyles.textColor"
            scrollable
          />
        </div>

        <p class="card-description">
          {{ template.description }}
        </p>

        <div class="card-all-tags">
          <span
            v-for="tag in template.tags"
            :key="tag"
            class="card-tag"
          >
            {{ tag }}
          </span>
        </div>

        <button
          class="card-apply-full"
          @click="handleApply"
        >
          Appliquer ce modèle
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.template-card {
  background-color: var(--color-surface);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  overflow: hidden;
}

.template-card:hover {
  background-color: var(--color-surface-hover);
  border-color: var(--color-border);
}

.template-card.expanded {
  border-color: var(--color-primary-300);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.template-card:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  position: relative;
}

.card-accent {
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.template-card:hover .card-accent,
.template-card.expanded .card-accent {
  opacity: 1;
}

.card-thumbnail {
  flex-shrink: 0;
  width: 44px;
  height: 62px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: var(--color-neutral-100);
  border: 1px solid var(--color-border);
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 3px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-tags {
  display: flex;
  gap: 4px;
}

.card-tag {
  font-size: 10px;
  padding: 1px 5px;
  background-color: var(--color-neutral-100);
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.card-quick-apply {
  flex-shrink: 0;
  padding: var(--space-1) var(--space-2);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);
}

.template-card:hover .card-quick-apply {
  opacity: 1;
}

.template-card.expanded .card-quick-apply {
  display: none;
}

.card-quick-apply:hover {
  background-color: var(--color-primary-600);
}

.card-quick-apply:focus-visible {
  opacity: 1;
  outline: none;
  box-shadow: var(--focus-ring);
}

.card-expand {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--transition-slow);
}

.template-card.expanded .card-expand {
  grid-template-rows: 1fr;
}

.card-expand-inner {
  overflow: hidden;
  min-height: 0;
}

.card-preview {
  overflow: hidden;
  background-color: var(--color-neutral-100);
  margin: 0 var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.card-description {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: var(--space-2) var(--space-2) 0;
  line-height: 1.4;
}

.card-all-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: var(--space-2) var(--space-2) 0;
}

.card-apply-full {
  width: calc(100% - var(--space-2) * 2);
  margin: var(--space-2);
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

.card-apply-full:hover {
  background-color: var(--color-primary-600);
}

.card-apply-full:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
</style>
