<script setup lang="ts">
/* eslint-disable no-alert */
import type { CampaignListItem } from '#shared/types/campaign'
import { Loader2, Plus, RefreshCw } from 'lucide-vue-next'
import CampaignCard from '@/components/campaigns/CampaignCard.vue'
import KreoLogo from '@/components/icons/KreoLogo.vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import { useCampaignsStore } from '@/stores/campaigns'

definePageMeta({
  title: 'Dashboard',
})

const api = useApi()
const authStore = useAuthStore()
const campaignsStore = useCampaignsStore()

const isLoading = ref(true)
const error = ref<string | null>(null)
const deletingId = ref<number | null>(null)

async function loadCampaigns() {
  isLoading.value = true
  error.value = null

  try {
    const response = await api.get<{ data: CampaignListItem[] }>('/api/v1/campaigns', {
      query: {
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      },
    })
    campaignsStore.setItems(response.data)
  }
  catch {
    error.value = 'Erreur de connexion au serveur'
  }
  finally {
    isLoading.value = false
  }
}

function handleCampaignClick(campaign: CampaignListItem) {
  navigateTo(`/campaigns/${campaign.id}`)
}

async function handleDelete(campaign: CampaignListItem) {
  const confirmed = window.confirm(`Supprimer "${campaign.title}" ? Cette action est irréversible.`)
  if (!confirmed)
    return

  deletingId.value = campaign.id

  try {
    await api.delete(`/api/v1/campaigns/${campaign.id}`)
    campaignsStore.removeItem(campaign.id)
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
  loadCampaigns()
})
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="dashboard-brand">
        <KreoLogo :size="32" />
        <h1 class="dashboard-title">
          Mes Campagnes
        </h1>
      </div>
      <div class="dashboard-actions">
        <NuxtLink to="/campaigns/new" class="btn-create">
          <Plus :size="18" />
          Nouvelle campagne
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
        <p>Chargement des campagnes...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <p class="error-text">
          {{ error }}
        </p>
        <button class="btn-retry" @click="loadCampaigns">
          <RefreshCw :size="16" />
          Réessayer
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="campaignsStore.items.length === 0" class="empty-state">
        <p class="empty-text">
          Vous n'avez pas encore de campagne.
        </p>
        <NuxtLink to="/campaigns/new" class="btn-create-large">
          <Plus :size="18" />
          Créer ma première campagne
        </NuxtLink>
      </div>

      <!-- Campaigns grid -->
      <div v-else class="campaigns-grid">
        <CampaignCard
          v-for="campaign in campaignsStore.items"
          :key="campaign.id"
          :campaign="campaign"
          @click="handleCampaignClick"
          @delete="handleDelete"
        />
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

/* Campaigns grid */
.campaigns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-6);
}
</style>
