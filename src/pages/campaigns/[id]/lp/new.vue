<script setup lang="ts">
import { useApi } from '@/composables/useApi'

definePageMeta({
  title: 'Nouvelle Landing Page',
})

const route = useRoute()
const router = useRouter()
const campaignId = computed(() => Number(route.params.id))
const api = useApi()

const isCreating = ref(true)
const createError = ref<string | null>(null)

async function createContent() {
  isCreating.value = true
  createError.value = null

  try {
    // Create new landing page content via API
    const content = await api.post<{ id: number }>(`/api/v1/campaigns/${campaignId.value}/contents`, {
      type: 'landing-page',
      title: 'Nouvelle page',
    })

    // Redirect to the editor with the new content ID
    router.replace(`/campaigns/${campaignId.value}/lp/${content.id}`)
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, message?: string }
    createError.value = err.message || 'Erreur lors de la création du contenu'
    isCreating.value = false
  }
}

onMounted(() => {
  createContent()
})
</script>

<template>
  <div class="create-page">
    <!-- Creating state -->
    <div v-if="isCreating" class="loading-overlay">
      <div class="loading-spinner" />
      <p>Création de la page...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="createError" class="error-overlay">
      <p class="error-message">
        {{ createError }}
      </p>
      <div class="error-actions">
        <button class="retry-btn" @click="createContent">
          Réessayer
        </button>
        <NuxtLink :to="`/campaigns/${campaignId}`" class="back-btn">
          Retour à la campagne
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-page {
  min-height: 100vh;
  background-color: var(--color-background);
}

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
}

.retry-btn:hover {
  background-color: var(--color-primary-dark);
}

.back-btn {
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
}

.back-btn:hover {
  background-color: var(--color-surface-hover);
}
</style>
