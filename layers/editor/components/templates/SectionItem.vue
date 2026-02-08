<script setup lang="ts">
import type { SectionPreset } from '../types/preset'
import { GripVertical } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps<{
  section: SectionPreset
}>()

const presetsStore = usePresetsStore()
const isDragging = ref(false)

function handleDragStart(event: DragEvent) {
  isDragging.value = true
  event.dataTransfer?.setData('section-preset', props.section.id)
  event.dataTransfer!.effectAllowed = 'copy'
}

function handleDragEnd() {
  isDragging.value = false
}

function handleClick() {
  // Add section to canvas on click
  presetsStore.addSection(props.section)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}
</script>

<template>
  <div
    class="section-item"
    :class="{ dragging: isDragging }"
    role="button"
    tabindex="0"
    draggable="true"
    :aria-label="`Section ${section.name}. Cliquez ou glissez pour ajouter.`"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <div class="drag-handle" aria-hidden="true">
      <GripVertical :size="16" />
    </div>

    <div class="section-thumbnail">
      <img
        :src="section.thumbnail"
        :alt="`Aperçu ${section.name}`"
        loading="lazy"
      >
    </div>

    <div class="section-info">
      <h4 class="section-name">
        {{ section.name }}
      </h4>
      <p class="section-description">
        {{ section.description }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.section-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: grab;
  transition: all var(--transition-fast);
}

.section-item:hover {
  border-color: var(--color-primary-400);
  background-color: var(--color-primary-50);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.section-item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.section-item.dragging {
  opacity: 0.7;
  cursor: grabbing;
  transform: scale(0.98);
}

.drag-handle {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.section-thumbnail {
  flex-shrink: 0;
  width: 60px;
  height: 40px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: var(--color-neutral-100);
}

.section-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.section-info {
  flex: 1;
  min-width: 0;
}

.section-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 2px 0;
  line-height: 1.3;
}

.section-description {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
