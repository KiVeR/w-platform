<script setup lang="ts">
/* eslint-disable no-alert */
import type { LandingPageListItem } from '@/services/api/types'
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import KreoLogo from '@/components/icons/KreoLogo.vue'
import { landingPageApi } from '@/services/api/landingPageApi'
import { useAuthStore } from '@/stores/auth'

definePageMeta({
  title: 'Dashboard',
})

const authStore = useAuthStore()

const pages = ref<LandingPageListItem[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const deletingId = ref<number | null>(null)

async function loadPages() {
  isLoading.value = true
  error.value = null

  try {
    const response = await landingPageApi.getLandingPages({
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    })

    if (response) {
      pages.value = response.data
    }
    else {
      error.value = 'Impossible de charger les landing pages'
    }
  }
  catch {
    error.value = 'Erreur de connexion au serveur'
  }
  finally {
    isLoading.value = false
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Brouillon',
    PUBLISHED: 'Publié',
    ARCHIVED: 'Archivé',
  }
  return labels[status] || status
}

async function handleDelete(page: LandingPageListItem) {
  const confirmed = window.confirm(`Supprimer "${page.title}" ? Cette action est irréversible.`)
  if (!confirmed)
    return

  deletingId.value = page.id

  try {
    const success = await landingPageApi.deleteLandingPage(page.id, true)
    if (success) {
      pages.value = pages.value.filter(p => p.id !== page.id)
    }
    else {
      alert('Erreur lors de la suppression')
    }
  }
  catch {
    alert('Erreur lors de la suppression')
  }
  finally {
    deletingId.value = null
  }
}

async function handleLogout() {
  await authStore.logout()
  navigateTo('/login')
}

onMounted(() => {
  loadPages()
})
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="dashboard-brand">
        <KreoLogo :size="32" />
        <h1 class="dashboard-title">
          Mes Landing Pages
        </h1>
      </div>
      <div class="dashboard-actions">
        <NuxtLink to="/editor/new" class="btn-create">
          <Plus :size="18" />
          Nouvelle page
        </NuxtLink>
        <span class="user-info">{{ authStore.fullName }}</span>
        <button class="btn-logout" @click="handleLogout">
          Déconnexion
        </button>
      </div>
    </header>

    <main class="dashboard-content">
      <!-- Loading state -->
      <div v-if="isLoading" class="loading-state">
        <Loader2 :size="32" class="animate-spin" />
        <p>Chargement des pages...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <p class="error-text">
          {{ error }}
        </p>
        <button class="btn-retry" @click="loadPages">
          <RefreshCw :size="16" />
          Réessayer
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="pages.length === 0" class="empty-state">
        <p class="empty-text">
          Vous n'avez pas encore de landing page.
        </p>
        <NuxtLink to="/editor/new" class="btn-create-large">
          <Plus :size="18" />
          Créer ma première page
        </NuxtLink>
      </div>

      <!-- Pages grid -->
      <div v-else class="pages-grid">
        <div v-for="page in pages" :key="page.id" class="page-card">
          <div class="page-card-header">
            <h3 class="page-title">
              {{ page.title }}
            </h3>
            <span class="page-status" :class="`status-${page.status.toLowerCase()}`">
              {{ getStatusLabel(page.status) }}
            </span>
          </div>
          <p class="page-date">
            Modifié le {{ formatDate(page.updatedAt) }}
          </p>
          <div class="page-actions">
            <NuxtLink :to="`/editor/${page.id}`" class="btn-edit">
              Éditer
            </NuxtLink>
            <button
              class="btn-delete"
              :disabled="deletingId === page.id"
              title="Supprimer"
              @click="handleDelete(page)"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-color: var(--color-background);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.dashboard-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.dashboard-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.dashboard-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.user-info {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background-color var(--transition-fast);
}

.btn-create:hover {
  background-color: var(--color-primary-dark);
}

.btn-logout {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-logout:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text);
}

.dashboard-content {
  padding: var(--space-8) var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

/* Loading state */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  color: var(--color-text-secondary);
  gap: var(--space-4);
}

/* Error state */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-12);
  gap: var(--space-4);
}

.error-text {
  font-size: var(--text-base);
  color: var(--color-error);
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-retry:hover {
  background-color: var(--color-surface-hover);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: var(--space-12);
}

.empty-text {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
}

.btn-create-large {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background-color var(--transition-fast);
}

.btn-create-large:hover {
  background-color: var(--color-primary-dark);
}

/* Pages grid */
.pages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
}

.page-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.page-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.page-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.page-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
}

.page-status {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.status-draft {
  background-color: var(--color-warning-100);
  color: var(--color-warning-700);
}

.status-published {
  background-color: var(--color-success-100);
  color: var(--color-success-700);
}

.status-archived {
  background-color: var(--color-neutral-200);
  color: var(--color-neutral-600);
}

.page-date {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: var(--space-3) 0;
}

.page-actions {
  display: flex;
  gap: var(--space-2);
}

.btn-edit {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-primary);
  background-color: transparent;
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
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  background-color: transparent;
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
</style>
