<script setup lang="ts">
/* eslint-disable no-alert */
import type { CampaignWithContents } from '../../../../shared/types/campaign'
import type { ContentType } from '../../../../shared/types/content'
import { ArrowLeft, Loader2, Plus, Settings, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'
import { STATUS_COLORS, STATUS_LABELS } from '../../../../shared/constants/status'
import { CONTENT_TYPE_EMOJI, CONTENT_TYPE_LABELS, isEditorAvailable } from '../../../../shared/types/content'

definePageMeta({
  title: 'Campagne',
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const campaignStore = useCampaignStore()

const campaignId = computed(() => Number(route.params.id))
const isLoading = ref(true)
const error = ref<string | null>(null)
const showAddModal = ref(false)
const deletingContentId = ref<number | null>(null)

async function loadCampaign() {
  isLoading.value = true
  error.value = null

  try {
    const campaign = await $fetch<CampaignWithContents>(`/api/v1/campaigns/${campaignId.value}`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    campaignStore.setCampaign(campaign)
  }
  catch {
    error.value = 'Erreur lors du chargement de la campagne'
  }
  finally {
    isLoading.value = false
  }
}

function getEditUrl(content: CampaignWithContents['contents'][0]): string {
  const typeSlug = content.type === 'landing-page' ? 'lp' : content.type
  return `/campaigns/${campaignId.value}/${typeSlug}/${content.id}`
}

function canEdit(type: ContentType): boolean {
  return isEditorAvailable(type)
}

async function handleAddContent(type: ContentType) {
  showAddModal.value = false

  // TODO: Replace with API call
  // const content = await campaignApi.createContent(campaignId.value, { type, title: 'Nouveau contenu' })
  const typeSlug = type === 'landing-page' ? 'lp' : type
  router.push(`/campaigns/${campaignId.value}/${typeSlug}/new`)
}

async function handleDeleteContent(content: CampaignWithContents['contents'][0]) {
  const confirmed = window.confirm(`Supprimer "${content.title}" ? Cette action est irréversible.`)
  if (!confirmed)
    return

  deletingContentId.value = content.id

  try {
    await $fetch(`/api/v1/campaigns/${campaignId.value}/contents/${content.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
    campaignStore.removeContent(content.id)
  }
  catch {
    alert('Erreur lors de la suppression')
  }
  finally {
    deletingContentId.value = null
  }
}

onMounted(() => {
  loadCampaign()
})
</script>

<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-left">
        <NuxtLink to="/dashboard" class="back-link">
          <ArrowLeft :size="20" />
          Retour
        </NuxtLink>
        <template v-if="!isLoading && campaignStore.title">
          <h1 class="page-title">
            {{ campaignStore.title }}
          </h1>
          <span
            class="status-badge" :class="[
              STATUS_COLORS[campaignStore.status],
            ]"
          >
            {{ STATUS_LABELS[campaignStore.status] }}
          </span>
        </template>
      </div>
      <div class="header-actions">
        <button class="btn-icon" title="Paramètres">
          <Settings :size="20" />
        </button>
      </div>
    </header>

    <main class="page-content">
      <!-- Loading state -->
      <div v-if="isLoading" class="loading-state">
        <Loader2 :size="32" class="animate-spin" />
        <p>Chargement de la campagne...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <p class="error-text">
          {{ error }}
        </p>
        <button class="btn-retry" @click="loadCampaign">
          Réessayer
        </button>
      </div>

      <!-- Campaign content -->
      <template v-else>
        <!-- Description -->
        <p v-if="campaignStore.description" class="campaign-description">
          {{ campaignStore.description }}
        </p>

        <!-- Contents section -->
        <section class="contents-section">
          <div class="section-header">
            <h2 class="section-title">
              Contenus de la campagne
            </h2>
            <button class="btn-add" @click="showAddModal = true">
              <Plus :size="18" />
              Ajouter
            </button>
          </div>

          <!-- Empty state -->
          <div v-if="campaignStore.contents.length === 0" class="empty-contents">
            <p>Aucun contenu dans cette campagne.</p>
            <button class="btn-add-large" @click="showAddModal = true">
              <Plus :size="18" />
              Ajouter un contenu
            </button>
          </div>

          <!-- Contents list -->
          <div v-else class="contents-list">
            <div
              v-for="content in campaignStore.contents"
              :key="content.id"
              class="content-card"
              :class="{ 'content-card--unavailable': !canEdit(content.type) }"
            >
              <div class="content-info">
                <span class="content-icon">{{ CONTENT_TYPE_EMOJI[content.type] }}</span>
                <div class="content-details">
                  <h3 class="content-title">
                    {{ content.title }}
                  </h3>
                  <div class="content-meta">
                    <span class="content-type">{{ CONTENT_TYPE_LABELS[content.type] }}</span>
                    <span
                      v-if="!canEdit(content.type)"
                      class="editor-badge"
                    >
                      Éditeur à venir
                    </span>
                    <span
                      v-else
                      class="status-badge-small" :class="[STATUS_COLORS[content.status]]"
                    >
                      {{ STATUS_LABELS[content.status] }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="content-actions">
                <NuxtLink
                  :to="getEditUrl(content)"
                  class="btn-edit"
                >
                  {{ canEdit(content.type) ? 'Éditer' : 'Voir' }}
                </NuxtLink>
                <button
                  class="btn-delete"
                  :disabled="deletingContentId === content.id"
                  title="Supprimer"
                  @click="handleDeleteContent(content)"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>
    </main>

    <!-- Add content modal -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-content">
          <h3 class="modal-title">
            Ajouter un contenu
          </h3>
          <p class="modal-description">
            Sélectionnez le type de contenu à créer
          </p>
          <div class="modal-options">
            <button
              v-for="type in campaignStore.enabledContentTypes"
              :key="type"
              class="modal-option"
              @click="handleAddContent(type)"
            >
              <span class="option-icon">{{ CONTENT_TYPE_EMOJI[type] }}</span>
              <span class="option-label">{{ CONTENT_TYPE_LABELS[type] }}</span>
              <span v-if="!canEdit(type)" class="option-badge">À venir</span>
            </button>
          </div>
          <button class="btn-cancel-modal" @click="showAddModal = false">
            Annuler
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: var(--color-background);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
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

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-full);
}

.header-actions {
  display: flex;
  gap: var(--space-2);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text);
}

.page-content {
  padding: var(--space-8) var(--space-6);
  max-width: 900px;
  margin: 0 auto;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  color: var(--color-text-secondary);
  gap: var(--space-4);
}

.error-text {
  color: var(--color-error);
}

.btn-retry {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.campaign-description {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
}

.contents-section {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-primary);
  background: transparent;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-add:hover {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.empty-contents {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}

.btn-add-large {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-5);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.contents-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.content-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.content-card:hover {
  border-color: var(--color-primary-light);
}

.content-card--unavailable {
  opacity: 0.7;
  background-color: var(--color-surface);
}

.content-card--unavailable:hover {
  border-color: var(--color-border);
}

.content-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.content-icon {
  font-size: var(--text-xl);
}

.content-title {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1) 0;
}

.content-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.content-type {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.editor-badge {
  padding: 2px 6px;
  font-size: 10px;
  font-weight: var(--font-medium);
  color: var(--color-warning-700);
  background-color: var(--color-warning-100);
  border-radius: var(--radius-sm);
}

.status-badge-small {
  padding: 2px 6px;
  font-size: 10px;
  font-weight: var(--font-medium);
  border-radius: var(--radius-sm);
}

.content-actions {
  display: flex;
  gap: var(--space-2);
}

.btn-edit {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-primary);
  background: transparent;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.btn-edit:hover {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.btn-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-delete:hover:not(:disabled) {
  background-color: var(--color-error);
  border-color: var(--color-error);
  color: white;
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  width: 100%;
  max-width: 400px;
  margin: var(--space-4);
}

.modal-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2) 0;
}

.modal-description {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.modal-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.modal-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.modal-option:hover {
  border-color: var(--color-primary);
  background-color: var(--color-primary-50);
}

.option-icon {
  font-size: var(--text-xl);
}

.option-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
}

.option-badge {
  position: absolute;
  right: var(--space-3);
  padding: 2px 6px;
  font-size: 10px;
  font-weight: var(--font-medium);
  color: var(--color-warning-700);
  background-color: var(--color-warning-100);
  border-radius: var(--radius-sm);
}

.btn-cancel-modal {
  width: 100%;
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-cancel-modal:hover {
  background-color: var(--color-surface-hover);
}
</style>
