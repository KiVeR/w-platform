<script setup lang="ts">
import type { EditorMode } from '@/stores/ui'
import { ChevronDown, History, PanelLeft, PanelRight, X } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
const modeDropdownOpen = ref(false)
const modeDropdownRef = ref<HTMLElement | null>(null)
const breadcrumbRef = ref<InstanceType<typeof BreadcrumbNav> | null>(null)

// Pass callback to useAutoSave to focus title when toast "Renommer" is clicked
const { saveStatus, lastSyncedAt, lastError, saveNow, needsFirstSave, createAndSave } = useAutoSave({
  onFirstSaveComplete: () => {
    breadcrumbRef.value?.focusTitle()
  },
})
const { navigateToHistory, navigateToEditor, isActive: isHistoryActive } = useVersionHistory()

const modes: { value: EditorMode, label: string }[] = [
  { value: 'designer', label: 'Designer' },
  { value: 'preview', label: 'Aperçu' },
  { value: 'expert', label: 'Expert' },
]

const currentModeLabel = computed(() => {
  if (uiStore.mode === 'history')
    return 'Historique'
  return modes.find(m => m.value === uiStore.mode)?.label ?? 'Designer'
})

// Only editable if we have a content ID (already saved)
const isTitleEditable = computed(() => contentStore.id !== null)

function selectMode(mode: EditorMode) {
  uiStore.setMode(mode)
  modeDropdownOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (modeDropdownRef.value && !modeDropdownRef.value.contains(event.target as Node)) {
    modeDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

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

      <button
        v-if="!isHistoryActive"
        class="toolbar-btn-ghost toolbar-btn-sidebar"
        :class="{ 'is-active': uiStore.leftSidebarOpen }"
        :title="uiStore.leftSidebarOpen ? 'Masquer widgets' : 'Afficher widgets'"
        :aria-label="uiStore.leftSidebarOpen ? 'Masquer la palette de widgets' : 'Afficher la palette de widgets'"
        :aria-pressed="uiStore.leftSidebarOpen"
        @click="uiStore.toggleLeftSidebar"
      >
        <PanelLeft :size="18" :stroke-width="2" />
      </button>
    </div>

    <div class="toolbar-center">
      <div v-if="!isHistoryActive" ref="modeDropdownRef" class="mode-dropdown">
        <button
          class="mode-dropdown-trigger"
          :aria-expanded="modeDropdownOpen"
          aria-haspopup="listbox"
          @click="modeDropdownOpen = !modeDropdownOpen"
        >
          <span class="mode-label">{{ currentModeLabel }}</span>
          <ChevronDown
            :size="16"
            :stroke-width="2"
            class="chevron"
            :class="{ rotated: modeDropdownOpen }"
          />
        </button>
        <transition name="dropdown">
          <div v-if="modeDropdownOpen" class="mode-dropdown-menu" role="listbox">
            <button
              v-for="mode in modes"
              :key="mode.value"
              class="mode-option"
              :class="{ active: uiStore.mode === mode.value }"
              role="option"
              :aria-selected="uiStore.mode === mode.value"
              @click="selectMode(mode.value)"
            >
              {{ mode.label }}
            </button>
          </div>
        </transition>
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

      <button
        v-if="!isHistoryActive"
        class="toolbar-btn-ghost"
        :class="{ 'is-active': uiStore.rightSidebarOpen }"
        :title="uiStore.rightSidebarOpen ? 'Masquer options' : 'Afficher options'"
        :aria-label="uiStore.rightSidebarOpen ? 'Masquer le panneau d\'options' : 'Afficher le panneau d\'options'"
        :aria-pressed="uiStore.rightSidebarOpen"
        @click="uiStore.toggleRightSidebar"
      >
        <PanelRight :size="18" :stroke-width="2" />
      </button>
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

.toolbar-btn-sidebar {
  margin-left: var(--space-2);
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

.mode-dropdown {
  position: relative;
}

.mode-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  transition: all 0.2s;
}

.mode-dropdown-trigger:hover {
  background-color: var(--color-background);
  border-color: var(--color-primary);
}

.mode-dropdown-trigger:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.mode-label {
  min-width: 60px;
  text-align: left;
}

.chevron {
  transition: transform 0.2s ease;
  color: var(--color-text-muted);
}

.chevron.rotated {
  transform: rotate(180deg);
}

.mode-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 140px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: 4px;
  z-index: 100;
}

.mode-option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text);
  text-align: left;
  transition: all 0.15s ease;
}

.mode-option:hover {
  background-color: var(--color-background);
}

.mode-option.active {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 500;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
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

.toolbar-btn-ghost.is-active {
  background-color: var(--color-primary-50, #eff6ff);
  color: var(--color-primary);
}

.toolbar-btn-ghost.is-active:hover {
  background-color: var(--color-primary-100, #dbeafe);
}

@media (max-width: 480px) {
  .toolbar {
    padding: 0 8px;
  }

  .toolbar-right {
    gap: 8px;
  }

  .mode-label {
    min-width: auto;
  }
}
</style>
