<script setup lang="ts">
import type { ContentType } from '#shared/types/content'
import { CONTENT_TYPE_LABELS, CONTENT_TYPES } from '#shared/types/content'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

// Response type from the API including primaryContentId
interface CampaignCreateResponse {
  id: number
  title: string
  primaryContentId: number | null
  contents: Array<{
    id: number
    type: ContentType
    title: string
  }>
}

definePageMeta({
  title: 'Nouvelle campagne',
})

const router = useRouter()
const authStore = useAuthStore()

const title = ref('')
const description = ref('')
const selectedTypes = ref<ContentType[]>(['landing-page'])
const isSubmitting = ref(false)
const error = ref<string | null>(null)

const contentTypeIcons: Record<ContentType, string> = {
  'landing-page': '🌐',
  'rcs': '💬',
  'sms': '📱',
}

const contentTypeDescriptions: Record<ContentType, string> = {
  'landing-page': 'Page web responsive avec widgets drag-drop',
  'rcs': 'Message enrichi avec cartes et boutons',
  'sms': 'Message texte simple',
}

// Check if a content type has an available editor
function isEditorAvailable(type: ContentType): boolean {
  return type === 'landing-page'
}

function toggleContentType(type: ContentType) {
  // Only allow toggling for landing-page (others are coming soon)
  if (!isEditorAvailable(type)) {
    return
  }

  const index = selectedTypes.value.indexOf(type)
  if (index === -1) {
    selectedTypes.value.push(type)
  }
  else if (selectedTypes.value.length > 1) {
    selectedTypes.value.splice(index, 1)
  }
}

function isTypeSelected(type: ContentType): boolean {
  return selectedTypes.value.includes(type)
}

async function handleSubmit() {
  if (!title.value.trim()) {
    error.value = 'Le titre est requis'
    return
  }

  if (selectedTypes.value.length === 0) {
    error.value = 'Sélectionnez au moins un type de contenu'
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    const campaign = await $fetch<CampaignCreateResponse>('/api/v1/campaigns', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      body: {
        title: title.value,
        description: description.value || undefined,
        enabledContentTypes: selectedTypes.value,
      },
    })

    // Redirect to LP editor if available, otherwise to campaign page
    if (campaign.primaryContentId && selectedTypes.value.includes('landing-page')) {
      router.push(`/campaigns/${campaign.id}/lp/${campaign.primaryContentId}`)
    }
    else {
      router.push(`/campaigns/${campaign.id}`)
    }
  }
  catch {
    error.value = 'Erreur lors de la création de la campagne'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <NuxtLink to="/dashboard" class="back-link">
        <ArrowLeft :size="20" />
        Retour
      </NuxtLink>
      <h1 class="page-title">
        Nouvelle campagne
      </h1>
    </header>

    <main class="page-content">
      <form class="campaign-form" @submit.prevent="handleSubmit">
        <!-- Error message -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- Title -->
        <div class="form-group">
          <label for="title" class="form-label">Nom de la campagne *</label>
          <input
            id="title"
            v-model="title"
            type="text"
            class="form-input"
            placeholder="Ex: Black Friday 2024"
            :disabled="isSubmitting"
          >
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="description" class="form-label">Description (optionnel)</label>
          <textarea
            id="description"
            v-model="description"
            class="form-textarea"
            placeholder="Décrivez l'objectif de cette campagne..."
            rows="3"
            :disabled="isSubmitting"
          />
        </div>

        <!-- Content types -->
        <div class="form-group">
          <label class="form-label">Types de contenu *</label>
          <p class="form-hint">
            Sélectionnez les types de contenu que vous souhaitez créer
          </p>

          <div class="content-types-grid">
            <button
              v-for="type in CONTENT_TYPES"
              :key="type"
              type="button"
              class="content-type-card"
              :class="{
                selected: isTypeSelected(type),
                unavailable: !isEditorAvailable(type),
              }"
              :disabled="isSubmitting || !isEditorAvailable(type)"
              :aria-disabled="!isEditorAvailable(type)"
              :title="!isEditorAvailable(type) ? 'Cette fonctionnalité arrive bientôt' : undefined"
              @click="toggleContentType(type)"
            >
              <span class="content-type-icon">{{ contentTypeIcons[type] }}</span>
              <span class="content-type-label">{{ CONTENT_TYPE_LABELS[type] }}</span>
              <span class="content-type-description">{{ contentTypeDescriptions[type] }}</span>
              <span v-if="!isEditorAvailable(type)" class="content-type-badge">Bientôt</span>
            </button>
          </div>
        </div>

        <!-- Submit -->
        <div class="form-actions">
          <NuxtLink to="/dashboard" class="btn-cancel">
            Annuler
          </NuxtLink>
          <button
            type="submit"
            class="btn-submit"
            :disabled="isSubmitting || !title.trim() || selectedTypes.length === 0"
          >
            <Loader2 v-if="isSubmitting" :size="18" class="animate-spin" />
            <span v-else>Créer et éditer</span>
          </button>
        </div>
      </form>
    </main>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: var(--color-background);
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-text);
}

.page-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.page-content {
  padding: var(--space-8) var(--space-6);
  max-width: 640px;
  margin: 0 auto;
}

.campaign-form {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.error-message {
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-error-100);
  border: 1px solid var(--color-error-200);
  border-radius: var(--radius-md);
  color: var(--color-error-700);
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
}

.form-group {
  margin-bottom: var(--space-5);
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.form-hint {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: var(--space-3);
  font-size: var(--text-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  transition: border-color var(--transition-fast);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-input:disabled,
.form-textarea:disabled {
  background-color: var(--color-background);
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.content-types-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.content-type-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.content-type-card:hover:not(:disabled) {
  border-color: var(--color-primary-light);
  background-color: var(--color-background);
}

.content-type-card.selected {
  border-color: var(--color-primary);
  background-color: var(--color-primary-50);
}

.content-type-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.content-type-card.unavailable {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--color-background);
}

.content-type-card.unavailable:hover {
  border-color: var(--color-border);
  background-color: var(--color-background);
}

.content-type-icon {
  font-size: var(--text-2xl);
}

.content-type-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
}

.content-type-description {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.4;
}

.content-type-badge {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  padding: 2px 6px;
  font-size: 10px;
  font-weight: var(--font-medium);
  color: var(--color-warning-700);
  background-color: var(--color-warning-100);
  border-radius: var(--radius-sm);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  margin-top: var(--space-6);
}

.btn-cancel {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.btn-cancel:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text);
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-5);
  min-width: 160px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.btn-submit:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .content-types-grid {
    grid-template-columns: 1fr;
  }
}
</style>
