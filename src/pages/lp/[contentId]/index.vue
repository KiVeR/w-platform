<script setup lang="ts">
import type { PageStatusType } from '#shared/constants/status'
import { useApi } from '@/composables/useApi'

interface ContentDesignResponse {
  id: number
  title: string
  status: PageStatusType
  variableSchemaUuid?: string | null
  design: DesignDocument
  updatedAt: string
}

useHead({ title: 'Éditeur' })

definePageMeta({
  title: 'Éditeur Landing Page',
  layout: 'editor',
})

const route = useRoute()
const contentId = computed(() => Number(route.params.contentId))

const editorStore = useEditorStore()
const contentStore = useContentStore()
const widgetsStore = useWidgetsStore()
const api = useApi()

const isLoading = ref(true)
const loadError = ref<string | null>(null)

async function loadContent(): Promise<void> {
  isLoading.value = true
  loadError.value = null

  try {
    const data = await api.get<ContentDesignResponse>(`/api/v1/contents/${contentId.value}/design`)

    editorStore.setDesign(data.design)
    widgetsStore.setWidgets(data.design.widgets || [])
    contentStore.setMetadata({
      id: data.id,
      type: 'landing-page',
      title: data.title,
      status: data.status,
      variableSchemaUuid: data.variableSchemaUuid ?? null,
    })
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, message?: string }
    loadError.value = err.message || 'Erreur lors du chargement du contenu'
    console.error('Failed to load content:', error)
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadContent()
})

onUnmounted(() => {
  editorStore.reset()
  contentStore.reset()
  useVariableSchemaStore().reset()
})
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner" />
      <p>Chargement du contenu...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="loadError" class="error-overlay">
      <p class="error-message">
        {{ loadError }}
      </p>
      <div class="error-actions">
        <button class="retry-btn" @click="loadContent">
          Réessayer
        </button>
        <NuxtLink to="/dashboard" class="back-btn">
          Retour au dashboard
        </NuxtLink>
      </div>
    </div>

    <!-- The editor layout handles rendering when loaded -->
  </div>
</template>

<style scoped>
.loading-overlay,
.error-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  background-color: var(--color-background);
  z-index: 100;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: var(--color-error);
  font-size: var(--text-lg);
}

.error-actions {
  display: flex;
  gap: var(--space-3);
}

.retry-btn {
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.retry-btn:hover {
  background-color: var(--color-primary-dark);
}

.back-btn {
  padding: var(--space-2) var(--space-4);
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all var(--transition-fast);
}

.back-btn:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text);
}
</style>
