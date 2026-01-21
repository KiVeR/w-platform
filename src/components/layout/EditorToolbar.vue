<script setup lang="ts">
import type { Component } from 'vue'
import type { EditorMode } from '@/stores/ui'
import { Code, Eye, History, Pencil, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import BreadcrumbNav from '@/components/layout/BreadcrumbNav.vue'
import CreateLandingPageModal from '@/components/ui/CreateLandingPageModal.vue'
import SaveStatus from '@/components/ui/SaveStatus.vue'
import { useAutoSave } from '@/composables/useAutoSave'
import { useVersionHistory } from '@/composables/useVersionHistory'
import { contentApi } from '@/services/api/contentApi'
import { useContentStore } from '@/stores/content'
import { useEditorStore } from '@/stores/editor'
import { useUIStore } from '@/stores/ui'

const router = useRouter()
const uiStore = useUIStore()
const editorStore = useEditorStore()
const contentStore = useContentStore()

const showCreateModal = ref(false)
const breadcrumbRef = ref<InstanceType<typeof BreadcrumbNav> | null>(null)

// Pass callback to useAutoSave to focus title when toast "Renommer" is clicked
const { saveStatus, lastSyncedAt, lastError, saveNow, needsFirstSave, createAndSave } = useAutoSave({
  onFirstSaveComplete: () => {
    breadcrumbRef.value?.focusTitle()
  },
})
const { navigateToHistory, navigateToEditor, isActive: isHistoryActive } = useVersionHistory()

const modes: { value: EditorMode, label: string, icon: Component }[] = [
  { value: 'designer', label: 'Designer', icon: Pencil },
  { value: 'preview', label: 'Aperçu', icon: Eye },
  { value: 'expert', label: 'Expert', icon: Code },
]

// Only editable if we have a content ID (already saved)
const isTitleEditable = computed(() => contentStore.id !== null)

function selectMode(mode: EditorMode) {
  uiStore.setMode(mode)
}

async function handleSave() {
  if (needsFirstSave.value) {
    showCreateModal.value = true
    return
  }

  if (!editorStore.isDirty)
    return
  await saveNow()
}

async function handleCreateConfirm(title: string) {
  const result = await createAndSave(title)
  showCreateModal.value = false

  if (result.success && result.id) {
    await router.replace(`/lp/${result.id}`)
  }
}

function handleCreateCancel() {
  showCreateModal.value = false
}

async function handleSaveTitle(newTitle: string) {
  if (!contentStore.id)
    return

  // Update local state immediately for responsiveness
  contentStore.updateTitle(newTitle)

  // Save to API
  await contentApi.updateContent(contentStore.id, { title: newTitle })
}

// Expose method for external focus (from toast action)
function focusTitle() {
  breadcrumbRef.value?.focusTitle()
}

defineExpose({
  focusTitle,
})
</script>

<template>
  <header class="toolbar">
    <div class="toolbar-left">
      <button
        v-if="isHistoryActive"
        class="toolbar-btn-ghost"
        title="Quitter l'historique (Échap)"
        aria-label="Quitter l'historique des versions"
        @click="navigateToEditor"
      >
        <X :size="18" :stroke-width="2" />
      </button>

      <BreadcrumbNav
        v-if="!isHistoryActive"
        ref="breadcrumbRef"
        :content-title="contentStore.title"
        :editable="isTitleEditable"
        @save-title="handleSaveTitle"
      />
    </div>

    <div class="toolbar-center">
      <div v-if="!isHistoryActive" class="mode-segmented" role="tablist" aria-label="Mode d'édition">
        <button
          v-for="mode in modes"
          :key="mode.value"
          class="mode-segment"
          role="tab"
          :class="{ active: uiStore.mode === mode.value }"
          :title="mode.label"
          :aria-label="mode.label"
          :aria-selected="uiStore.mode === mode.value"
          @click="selectMode(mode.value)"
        >
          <component :is="mode.icon" :size="16" :stroke-width="2" />
        </button>
      </div>
    </div>

    <div class="toolbar-right">
      <button
        v-if="contentStore.id && !isHistoryActive"
        class="toolbar-btn-ghost"
        title="Historique des versions (Ctrl+H)"
        aria-label="Ouvrir l'historique des versions"
        @click="navigateToHistory"
      >
        <History :size="18" :stroke-width="2" />
      </button>

      <SaveStatus
        v-if="!isHistoryActive"
        :status="saveStatus"
        :is-dirty="editorStore.isDirty"
        :needs-first-save="needsFirstSave"
        :last-synced-at="lastSyncedAt"
        :last-error="lastError"
        @save="handleSave"
        @retry="handleSave"
        @create="showCreateModal = true"
      />
    </div>

    <CreateLandingPageModal
      v-if="showCreateModal"
      @confirm="handleCreateConfirm"
      @cancel="handleCreateCancel"
    />
  </header>
</template>

<style scoped>
.toolbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: var(--header-height);
  padding: 0 12px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  width: 100%;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
}

.toolbar-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-segmented {
  display: flex;
  background: var(--color-neutral-100);
  border-radius: var(--radius-md);
  padding: 2px;
}

.mode-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-segment:hover {
  color: var(--color-text);
}

.mode-segment:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.mode-segment.active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-xs);
}

.toolbar-btn-ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-btn-ghost:hover {
  background-color: var(--color-background);
  color: var(--color-text);
}

.toolbar-btn-ghost:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

@media (max-width: 480px) {
  .toolbar {
    padding: 0 8px;
  }

  .toolbar-right {
    gap: 8px;
  }
}
</style>
