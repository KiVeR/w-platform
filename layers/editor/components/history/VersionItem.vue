<script setup lang="ts">
import type { VersionSummary } from '../../services/contentVersionApi'
import { Clock, Layers } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  version: VersionSummary
  selected?: boolean
}>()

defineEmits<{
  select: [id: number]
}>()

const relativeTime = computed(() => formatRelativeTime(props.version.createdAt))
</script>

<template>
  <button
    class="version-item"
    :class="{ selected, 'is-latest': version.isCurrent }"
    role="option"
    :aria-selected="selected"
    @click="$emit('select', version.id)"
  >
    <div class="version-header">
      <span class="version-number">v{{ version.version }}</span>
      <span v-if="version.isCurrent" class="badge-latest">Actuelle</span>
    </div>

    <div class="version-meta">
      <span class="meta-item">
        <Clock :size="12" />
        {{ relativeTime }}
      </span>
      <span class="meta-item">
        <Layers :size="12" />
        {{ version.widgetCount }} widget{{ version.widgetCount !== 1 ? 's' : '' }}
      </span>
    </div>
  </button>
</template>

<style scoped>
.version-item {
  width: 100%;
  padding: 12px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background-color 0.15s ease;
}

.version-item:hover {
  background-color: var(--color-neutral-100);
}

.version-item.selected {
  background-color: var(--color-info-100);
}

.version-item:focus-visible {
  outline: 2px solid var(--color-info);
  outline-offset: -2px;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.version-number {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.badge-latest {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  background-color: var(--color-success);
  color: white;
  border-radius: var(--radius-sm);
}

.version-meta {
  display: flex;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-neutral-500);
}
</style>
