<script setup lang="ts">
import type { PageStatusType } from '#shared/constants/status'
import type { DesignDocument } from '@/types/widget'
import { useApi } from '@/composables/useApi'
import { useContentStore } from '@/stores/content'
import { useEditorStore } from '@/stores/editor'
import { useUIStore } from '@/stores/ui'
import { useWidgetsStore } from '@/stores/widgets'

interface ContentDesignResponse {
  id: number
  title: string
  status: PageStatusType
  design: DesignDocument
  updatedAt: string
}

definePageMeta({
  title: 'Éditeur Landing Page',
  layout: 'editor',
})

const route = useRoute()
const campaignId = computed(() => Number(route.params.id))
const contentId = computed(() => Number(route.params.contentId))

const uiStore = useUIStore()
const editorStore = useEditorStore()
const contentStore = useContentStore()
const widgetsStore = useWidgetsStore()
const api = useApi()

const isLoading = ref(true)
const loadError = ref<string | null>(null)

async function loadContent() {
  isLoading.value = true
  loadError.value = null

  try {
    const data = await api.get<ContentDesignResponse>(`/api/v1/campaigns/${campaignId.value}/contents/${contentId.value}/design`)

    // Update stores with loaded data
    editorStore.setDesign(data.design)
    widgetsStore.setWidgets(data.design.widgets || [])

    contentStore.setMetadata({
      id: data.id,
      type: 'landing-page',
      campaignId: campaignId.value,
      title: data.title,
      status: data.status,
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
  uiStore.setCampaignContext(campaignId.value, 'landing-page')
  loadContent()
})

onUnmounted(() => {
  uiStore.clearCampaignContext()
  editorStore.reset()
  contentStore.reset()
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
      <button class="retry-btn" @click="loadContent">
        Réessayer
      </button>
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
