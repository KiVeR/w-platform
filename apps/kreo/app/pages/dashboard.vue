<script setup lang="ts">
/* eslint-disable no-alert */
import type { ContentListItem, ContentsListResponse, ContentType, RecentContentsResponse } from '#shared/types/content'
import { isEditorAvailable } from '#shared/types/content'
import { getContentTypeSlug } from '#shared/utils/content'
import { Loader2, RefreshCw } from 'lucide-vue-next'
import ContentCard from '@/components/contents/ContentCard.vue'
import ContentFilterBar from '@/components/contents/ContentFilterBar.vue'
import QuickAccessSection from '@/components/contents/QuickAccessSection.vue'
import SplitButton from '@/components/contents/SplitButton.vue'
import EmptyDashboard from '@/components/dashboard/EmptyDashboard.vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import { useContentsStore } from '@/stores/contents'

useHead({ title: 'Dashboard' })

definePageMeta({
  title: 'Dashboard',
})

const router = useRouter()
const api = useApi()
const authStore = useAuthStore()
const contentsStore = useContentsStore()

const isLoading = ref(true)
const error = ref<string | null>(null)
const splitButtonRef = ref<InstanceType<typeof SplitButton> | null>(null)

// Filter state
const selectedType = ref<ContentType | undefined>(undefined)
const searchQuery = ref('')

// Debounced search
const debouncedSearch = refDebounced(searchQuery, 300)

async function loadDashboard(): Promise<void> {
  isLoading.value = true
  error.value = null

  try {
    const [recentResponse, contentsResponse] = await Promise.all([
      api.get<RecentContentsResponse>('/ai/contents/recent'),
      api.get<ContentsListResponse>('/ai/contents', {
        query: {
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          limit: 50,
        },
      }),
    ])

    contentsStore.setRecentItems(recentResponse.recent)
    contentsStore.setFavoriteItems(recentResponse.favorites)
    contentsStore.setItems(contentsResponse.data)
    contentsStore.setPagination(
      contentsResponse.page,
      contentsResponse.total,
      contentsResponse.totalPages,
    )
  }
  catch {
    error.value = 'Erreur de connexion au serveur'
  }
  finally {
    isLoading.value = false
  }
}

// Dashboard state: empty, getting-started, or normal
const dashboardState = computed(() => {
  if (contentsStore.pagination.total === 0)
    return 'empty'
  if (contentsStore.pagination.total < 3)
    return 'getting-started'
  return 'normal'
})

// Check if QuickAccess has content
const hasQuickAccessContent = computed(() => {
  return contentsStore.recentItems.length > 0 || contentsStore.favoriteItems.length > 0
})

// Filtered contents based on type and search
const filteredContents = computed(() => {
  let items = contentsStore.items

  if (selectedType.value) {
    items = items.filter(item => item.type === selectedType.value)
  }

  if (debouncedSearch.value) {
    const search = debouncedSearch.value.toLowerCase()
    items = items.filter(item =>
      item.title.toLowerCase().includes(search),
    )
  }

  return items
})

async function handleToggleFavorite(content: ContentListItem): Promise<void> {
  try {
    await api.post<{ success: boolean, isFavorite: boolean }>(`/ai/contents/${content.id}/favorite`)
    contentsStore.toggleFavorite(content.id)
  }
  catch {
    alert('Erreur lors de la mise à jour des favoris')
  }
}

async function handleDeleteContent(content: ContentListItem): Promise<void> {
  const confirmed = window.confirm(`Supprimer "${content.title}" ? Cette action est irréversible.`)
  if (!confirmed)
    return

  try {
    await api.delete(`/ai/contents/${content.id}`)
    contentsStore.removeItem(content.id)
  }
  catch {
    alert('Erreur lors de la suppression')
  }
}

function handleCreateContent(type: ContentType): void {
  // For RCS/SMS, redirect to coming-soon page
  if (!isEditorAvailable(type)) {
    router.push(`/${getContentTypeSlug(type)}/coming-soon`)
    return
  }

  // Navigate to /lp/new - content will be created on first modification
  router.push(`/${getContentTypeSlug(type)}/new`)
}

async function handleLogout(): Promise<void> {
  await authStore.logout()
  navigateTo('/login')
}

function handleKeydown(e: KeyboardEvent) {
  // Ctrl+K (Windows) or Cmd+K (Mac) to open content creation menu
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    splitButtonRef.value?.open()
  }
}

onMounted(() => {
  loadDashboard()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="dashboard">
    <!-- Skip link for keyboard users -->
    <a href="#main-content" class="skip-link">
      Aller au contenu principal
    </a>

    <header class="dashboard-header">
      <div class="dashboard-brand">
        <KreoLogo :size="32" aria-hidden="true" />
        <h1 class="dashboard-title">
          <span class="visually-hidden">Kreo - </span>Tableau de bord
        </h1>
      </div>
      <div class="dashboard-actions">
        <SplitButton ref="splitButtonRef" @create="handleCreateContent" />
        <span class="user-info">{{ authStore.fullName }}</span>
        <button class="btn-logout" @click="handleLogout">
          Déconnexion
        </button>
      </div>
    </header>

    <main id="main-content" class="dashboard-content">
      <!-- Loading state -->
      <div v-if="isLoading" class="loading-state" role="status" aria-live="polite">
        <Loader2 :size="32" class="animate-spin" aria-hidden="true" />
        <p>Chargement...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-state" role="alert">
        <p class="error-text">
          {{ error }}
        </p>
        <button class="btn-retry" @click="loadDashboard">
          <RefreshCw :size="16" aria-hidden="true" />
          Réessayer
        </button>
      </div>

      <!-- Empty state: show welcome screen -->
      <template v-else-if="dashboardState === 'empty'">
        <EmptyDashboard
          :user-name="authStore.user?.firstName"
          @create="handleCreateContent"
        />
      </template>

      <!-- Dashboard content (getting-started or normal) -->
      <template v-else>
        <!-- Quick Access Section (only if has content) -->
        <section v-if="hasQuickAccessContent" class="dashboard-section">
          <QuickAccessSection
            :recent-items="contentsStore.recentItems"
            :favorite-items="contentsStore.favoriteItems"
            @toggle-favorite="handleToggleFavorite"
          />
        </section>

        <!-- All Contents Section -->
        <section class="dashboard-section">
          <div class="section-header">
            <h2 class="section-title">
              Tous les contenus
            </h2>
            <span class="content-count">{{ contentsStore.pagination.total }} contenu{{ contentsStore.pagination.total > 1 ? 's' : '' }}</span>
          </div>

          <ContentFilterBar
            v-model:selected-type="selectedType"
            v-model:search-query="searchQuery"
          />

          <!-- Empty state when filters applied -->
          <div v-if="filteredContents.length === 0" class="empty-contents">
            <p>
              Aucun contenu ne correspond à vos critères.
            </p>
          </div>

          <!-- Contents list -->
          <div v-else class="contents-list">
            <ContentCard
              v-for="content in filteredContents"
              :key="content.id"
              :content="content"
              @delete="handleDeleteContent"
              @toggle-favorite="handleToggleFavorite"
            />
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
/* Skip link for keyboard navigation */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  text-decoration: none;
  font-weight: var(--font-medium);
  z-index: 100;
  transition: top 0.2s ease;
}

.skip-link:focus {
  top: 0;
}

/* Visually hidden but accessible to screen readers */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.dashboard {
  height: 100vh;
  overflow-y: auto;
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
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
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
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

/* Loading & Error states */
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

/* Sections */
.dashboard-section {
  margin-bottom: var(--space-8);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.content-count {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

/* Contents list */
.contents-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.empty-contents {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}

.btn-create-large {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.btn-create-large:hover {
  background-color: var(--color-primary-dark);
}

.btn-create:focus-visible,
.btn-logout:focus-visible,
.btn-retry:focus-visible,
.btn-create-large:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.dashboard-content {
  animation: fadeIn 0.3s ease-out;
}

.contents-list > * {
  animation: fadeIn 0.3s ease-out backwards;
}

.contents-list > *:nth-child(1) { animation-delay: 0ms; }
.contents-list > *:nth-child(2) { animation-delay: 30ms; }
.contents-list > *:nth-child(3) { animation-delay: 60ms; }
.contents-list > *:nth-child(4) { animation-delay: 90ms; }
.contents-list > *:nth-child(5) { animation-delay: 120ms; }
.contents-list > *:nth-child(n+6) { animation-delay: 150ms; }

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }

  .dashboard-content,
  .contents-list > * {
    animation: none;
  }
}
</style>
