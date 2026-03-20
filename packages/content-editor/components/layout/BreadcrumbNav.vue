<script setup lang="ts">
import { ChevronRight, Home } from 'lucide-vue-next'
import { ref } from 'vue'
import EditableTitle from './EditableTitle.vue'

const props = withDefaults(defineProps<{
  contentTitle: string
  editable?: boolean
  homePath?: string | null
  homeAriaLabel?: string
}>(), {
  editable: false,
  homePath: null,
  homeAriaLabel: 'Retour',
})

const emit = defineEmits<{
  saveTitle: [value: string]
}>()

const editableTitleRef = ref<InstanceType<typeof EditableTitle> | null>(null)

function handleSaveTitle(newTitle: string) {
  emit('saveTitle', newTitle)
}

function focusTitle() {
  editableTitleRef.value?.startEdit()
}

defineExpose({
  focusTitle,
})
</script>

<template>
  <nav class="breadcrumb" aria-label="Fil d'Ariane">
    <ol class="breadcrumb-list">
      <li v-if="props.homePath" class="breadcrumb-item">
        <NuxtLink
          :to="props.homePath"
          class="breadcrumb-home"
          :title="props.homeAriaLabel"
          :aria-label="props.homeAriaLabel"
        >
          <Home :size="16" aria-hidden="true" />
        </NuxtLink>
        <ChevronRight
          :size="14"
          class="breadcrumb-separator"
          aria-hidden="true"
        />
      </li>

      <li class="breadcrumb-item">
        <EditableTitle
          v-if="props.editable"
          ref="editableTitleRef"
          :model-value="props.contentTitle || 'Sans titre'"
          placeholder="Sans titre"
          :max-length="200"
          @save="handleSaveTitle"
        />
        <span v-else class="breadcrumb-current" aria-current="page">
          {{ props.contentTitle || 'Sans titre' }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: var(--space-1);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.breadcrumb-home {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-text-muted);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.breadcrumb-home:hover {
  color: var(--color-text);
  background-color: var(--color-background);
}

.breadcrumb-home:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.breadcrumb-current {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.breadcrumb-separator {
  color: var(--color-text-muted);
  flex-shrink: 0;
}
</style>
