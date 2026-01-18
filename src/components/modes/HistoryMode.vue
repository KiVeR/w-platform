<script setup lang="ts">
import { History } from 'lucide-vue-next'
import { computed } from 'vue'
import MobileFrame from '@/components/canvas/MobileFrame.vue'
import PreviewContent from '@/components/canvas/PreviewContent.vue'
import HistoryBanner from '@/components/history/HistoryBanner.vue'
import { useVersionHistory } from '@/composables/useVersionHistory'

const { selectedVersion, isLoading, isLoadingVersion } = useVersionHistory()

const displayDesign = computed(() => selectedVersion.value?.design ?? null)

// Show loading overlay only when switching between versions (not initial load)
const showLoadingOverlay = computed(() => isLoadingVersion.value && selectedVersion.value !== null)

const formattedDate = computed(() => {
  if (!selectedVersion.value)
    return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(selectedVersion.value.createdAt))
})
</script>

<template>
  <div class="history-mode">
    <!-- Banner when a version is selected -->
    <HistoryBanner
      v-if="selectedVersion"
      :version="selectedVersion.version"
      :date="formattedDate"
      :is-latest="selectedVersion.isLatest"
    />

    <!-- Loading state -->
    <div v-if="isLoading && !selectedVersion" class="loading-state">
      <div class="skeleton-phone" />
    </div>

    <!-- Preview when version is selected -->
    <div v-else-if="displayDesign" class="history-preview">
      <!-- Loading overlay when switching versions -->
      <Transition name="fade">
        <div v-if="showLoadingOverlay" class="loading-overlay">
          <div class="spinner" />
        </div>
      </Transition>

      <MobileFrame :show-frame="true">
        <PreviewContent :design="displayDesign" />
      </MobileFrame>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <History :size="64" class="empty-icon" />
      <p>Sélectionnez une version dans le panneau de droite</p>
    </div>
  </div>
</template>

<style scoped>
.history-mode {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  overflow: hidden;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.skeleton-phone {
  width: 200px;
  aspect-ratio: 393 / 852;
  background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 24px;
}

.history-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 24px 24px;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  text-align: center;
  padding: 24px;
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* Loading overlay for version switching */
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  z-index: 10;
  border-radius: var(--radius-lg);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
