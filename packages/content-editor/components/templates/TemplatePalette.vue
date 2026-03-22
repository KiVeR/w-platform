<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  searchQuery?: string
}>()

const presetsStore = usePresetsStore()

const selectedCategory = ref<TemplateCategory | ''>('')
const expandedTemplateId = ref<string | null>(null)

const filteredTemplates = computed(() => {
  return presetsStore.filterTemplates(
    props.searchQuery || '',
    selectedCategory.value || undefined,
  )
})

watch(() => props.searchQuery, (query) => {
  if (query?.trim()) {
    selectedCategory.value = ''
  }
})

watch([selectedCategory, () => props.searchQuery], () => {
  expandedTemplateId.value = null
})

const resultsText = computed(() => {
  const count = filteredTemplates.value.length
  if (count === 0)
    return 'Aucun template trouvé'
  if (count === 1)
    return '1 template'
  return `${count} templates`
})

function handleToggle(templateId: string) {
  expandedTemplateId.value = expandedTemplateId.value === templateId ? null : templateId
}

function handleApplyTemplate(template: TemplatePreset) {
  presetsStore.openApplyModal(template)
}
</script>

<template>
  <div class="template-palette">
    <div class="category-filter">
      <button
        class="category-chip"
        :class="{ active: selectedCategory === '' }"
        @click="selectedCategory = ''"
      >
        Tous
      </button>
      <button
        v-for="category in presetsStore.templateCategoryList"
        :key="category.id"
        class="category-chip"
        :class="{ active: selectedCategory === category.id }"
        @click="selectedCategory = category.id"
      >
        {{ category.label }}
      </button>
    </div>

    <div class="results-info">
      {{ resultsText }}
    </div>

    <div class="template-list">
      <TemplateCard
        v-for="template in filteredTemplates"
        :key="template.id"
        :template="template"
        :expanded="expandedTemplateId === template.id"
        @apply="handleApplyTemplate"
        @toggle="handleToggle"
      />
    </div>

    <div v-if="filteredTemplates.length === 0" class="empty-state">
      <p>Aucun template ne correspond à votre recherche.</p>
    </div>

    <ApplyTemplateModal
      v-if="presetsStore.selectedTemplate"
      :template="presetsStore.selectedTemplate"
      :is-open="presetsStore.isApplyModalOpen"
      @confirm="presetsStore.applyTemplate(presetsStore.selectedTemplate)"
      @cancel="presetsStore.closeApplyModal"
    />
  </div>
</template>

<style scoped>
.template-palette {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.category-chip {
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.category-chip:hover {
  border-color: var(--color-primary-400);
  color: var(--color-text);
}

.category-chip.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.results-info {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.empty-state {
  text-align: center;
  padding: var(--space-6) var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
</style>
