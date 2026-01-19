<script setup lang="ts">
import type { VersionSummary } from '@/services/api/contentVersionApi'
import { History } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import VersionItem from './VersionItem.vue'

const props = defineProps<{
  versions: VersionSummary[]
  selectedId?: number | null
  isLoading: boolean
  hasMore: boolean
}>()

const emit = defineEmits<{
  select: [id: number]
  loadMore: []
}>()

const listRef = ref<HTMLElement | null>(null)
const focusedIndex = ref(0)

const currentIndex = computed(() => {
  if (!props.selectedId)
    return -1
  return props.versions.findIndex(v => v.id === props.selectedId)
})

watch(currentIndex, (index) => {
  if (index >= 0) {
    focusedIndex.value = index
  }
})

function handleScroll(event: Event): void {
  const el = event.target as HTMLElement
  const threshold = 50

  if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
    if (!props.isLoading && props.hasMore) {
      emit('loadMore')
    }
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (props.versions.length === 0)
    return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      focusedIndex.value = Math.min(focusedIndex.value + 1, props.versions.length - 1)
      emit('select', props.versions[focusedIndex.value].id)
      break
    case 'ArrowUp':
      event.preventDefault()
      focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
      emit('select', props.versions[focusedIndex.value].id)
      break
  }
}

onMounted(() => {
  if (listRef.value) {
    listRef.value.addEventListener('scroll', handleScroll)
  }
})
</script>

<template>
  <div
    ref="listRef"
    class="version-list"
    role="listbox"
    tabindex="0"
    aria-label="Liste des versions"
    aria-live="polite"
    @keydown="handleKeydown"
  >
    <template v-if="versions.length > 0">
      <VersionItem
        v-for="version in versions"
        :key="version.id"
        :version="version"
        :selected="selectedId === version.id"
        @select="emit('select', $event)"
      />

      <div v-if="isLoading" class="loading-more">
        <div class="spinner" />
        Chargement...
      </div>
    </template>

    <div v-else-if="isLoading" class="loading-state">
      <div class="skeleton-item" />
      <div class="skeleton-item" />
      <div class="skeleton-item" />
    </div>

    <div v-else class="empty-state">
      <History :size="32" class="empty-icon" />
      <p>Aucune version disponible</p>
    </div>
  </div>
</template>

<style scoped>
.version-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--color-neutral-500);
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.skeleton-item {
  height: 60px;
  background: linear-gradient(90deg, var(--color-neutral-100) 25%, var(--color-border) 50%, var(--color-neutral-100) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
  margin-bottom: 8px;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  color: var(--color-neutral-500);
  font-size: 13px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-info);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
</style>
