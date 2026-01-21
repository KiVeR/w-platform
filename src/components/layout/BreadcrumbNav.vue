<script setup lang="ts">
import { ChevronRight, Home } from 'lucide-vue-next'
import { ref } from 'vue'
import EditableTitle from './EditableTitle.vue'

defineProps<{
  contentTitle: string
  editable?: boolean
}>()

const emit = defineEmits<{
  'update:contentTitle': [value: string]
  'saveTitle': [value: string]
}>()

const editableTitleRef = ref<InstanceType<typeof EditableTitle> | null>(null)

function handleSaveTitle(newTitle: string) {
  emit('update:contentTitle', newTitle)
  emit('saveTitle', newTitle)
}

// Expose method for external triggering (from toast action)
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
      <li class="breadcrumb-item">
        <NuxtLink
          to="/dashboard"
          class="breadcrumb-home"
          title="Retour au dashboard"
          aria-label="Retour au dashboard"
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
          v-if="editable"
          ref="editableTitleRef"
          :model-value="contentTitle || 'Sans titre'"
          placeholder="Sans titre"
          :max-length="200"
          @save="handleSaveTitle"
        />
        <span v-else class="breadcrumb-current" aria-current="page">
          {{ contentTitle || 'Sans titre' }}
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
