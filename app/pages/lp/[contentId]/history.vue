<script setup lang="ts">
import type { PageStatusType } from '#shared/constants/status'
import { useApi } from '@/composables/useApi'

interface ContentDesignResponse {
  id: number
  title: string
  status: PageStatusType
  design: DesignDocument
  updatedAt: string
}

useHead({ title: 'Historique' })

definePageMeta({
  title: 'Historique des versions',
  layout: 'editor',
})

const route = useRoute()
const contentId = computed(() => Number(route.params.contentId))

const uiStore = useUIStore()
const editorStore = useEditorStore()
const contentStore = useContentStore()
const widgetsStore = useWidgetsStore()
const api = useApi()

const { enterHistoryMode, navigateToEditor } = useVersionHistory()

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
    })

    await enterHistoryMode()
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
  uiStore.exitHistoryMode()
  editorStore.reset()
  contentStore.reset()
})
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner" />
      <p>Chargement de l'historique...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="loadError" class="error-overlay">
      <p class="error-message">
        {{ loadError }}
      </p>
      <div class="error-actions">
        <button class="back-btn" @click="navigateToEditor">
          Retour à l'éditeur
        </button>
        <button class="retry-btn" @click="loadContent">
          Réessayer
        </button>
      </div>
    </div>

    <!-- The editor layout handles rendering history mode when loaded -->
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

.back-btn {
  padding: var(--space-2) var(--space-4);
  background-color: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.back-btn:hover {
  background-color: var(--color-surface);
}

.retry-btn {
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.retry-btn:hover {
  background-color: var(--color-primary-dark);
}
</style>
