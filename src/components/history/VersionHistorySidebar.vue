<script setup lang="ts">
import { History, RotateCcw } from 'lucide-vue-next'
import { ref } from 'vue'
import { useVersionHistory } from '@/composables/useVersionHistory'
import RestoreConfirmModal from './RestoreConfirmModal.vue'
import VersionList from './VersionList.vue'

const {
  versions,
  selectedVersion,
  isLoading,
  isRestoring,
  hasMore,
  loadMore,
  selectVersion,
  restoreVersion,
  navigateToEditor,
} = useVersionHistory()

const showConfirmModal = ref(false)

function handleSelect(id: number): void {
  selectVersion(id)
}

function handleRestoreClick(): void {
  showConfirmModal.value = true
}

async function handleConfirmRestore(): Promise<void> {
  showConfirmModal.value = false
  if (selectedVersion.value) {
    await restoreVersion(selectedVersion.value.id)
  }
}

function handleCancelRestore(): void {
  showConfirmModal.value = false
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && !showConfirmModal.value) {
    navigateToEditor()
  }
}
</script>

<template>
  <aside
    class="version-history-sidebar"
    role="region"
    aria-label="Historique des versions"
    @keydown="handleKeydown"
  >
    <header class="sidebar-header">
      <div class="header-title">
        <History :size="18" />
        <h2>Historique</h2>
      </div>
    </header>

    <div class="sidebar-content">
      <VersionList
        :versions="versions"
        :selected-id="selectedVersion?.id"
        :is-loading="isLoading && versions.length === 0"
        :has-more="hasMore"
        @select="handleSelect"
        @load-more="loadMore"
      />
    </div>

    <footer v-if="selectedVersion" class="sidebar-actions">
      <button
        v-if="!selectedVersion.isLatest"
        class="btn-restore"
        :disabled="isRestoring"
        @click="handleRestoreClick"
      >
        <RotateCcw v-if="!isRestoring" :size="16" />
        <span v-if="isRestoring" class="spinner" />
        {{ isRestoring ? 'Restauration...' : 'Restaurer cette version' }}
      </button>
      <p v-else class="current-notice">
        Cette version est déjà active
      </p>
    </footer>

    <RestoreConfirmModal
      v-if="showConfirmModal && selectedVersion"
      :version-number="selectedVersion.version"
      @confirm="handleConfirmRestore"
      @cancel="handleCancelRestore"
    />
  </aside>
</template>

<style scoped>
.version-history-sidebar {
  width: var(--sidebar-right-width);
  background-color: var(--color-surface);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
}

.sidebar-header {
  display: flex;
  align-items: center;
  height: var(--header-height);
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text);
}

.header-title h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-actions {
  padding: 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.btn-restore {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background-color: var(--color-primary);
  color: white;
  border: none;
  transition: background-color 0.2s;
}

.btn-restore:hover:not(:disabled) {
  background-color: var(--color-primary-dark, #2563eb);
}

.btn-restore:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.current-notice {
  margin: 0;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-muted);
}
</style>
