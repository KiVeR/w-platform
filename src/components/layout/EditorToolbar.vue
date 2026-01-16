<script setup lang="ts">
import type { EditorMode } from '@/stores/ui'
import { ArrowLeft, ChevronDown, PanelLeft, PanelRight } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import CreateLandingPageModal from '@/components/ui/CreateLandingPageModal.vue'
import SaveStatus from '@/components/ui/SaveStatus.vue'
import { useAutoSave } from '@/composables/useAutoSave'
import { useEditorStore } from '@/stores/editor'
import { useUIStore } from '@/stores/ui'

const router = useRouter()
const uiStore = useUIStore()
const editorStore = useEditorStore()

const { saveStatus, lastSyncedAt, lastError, saveNow, needsFirstSave, createAndSave } = useAutoSave()

const showCreateModal = ref(false)
const modeDropdownOpen = ref(false)
const modeDropdownRef = ref<HTMLElement | null>(null)

const modes: { value: EditorMode, label: string }[] = [
  { value: 'designer', label: 'Designer' },
  { value: 'preview', label: 'Aperçu' },
  { value: 'expert', label: 'Expert' },
]

const currentModeLabel = computed(() => {
  return modes.find(m => m.value === uiStore.mode)?.label ?? 'Designer'
})

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
    await router.replace(`/editor/${result.id}`)
  }
}

function handleCreateCancel() {
  showCreateModal.value = false
}
</script>

<template>
  <header class="toolbar">
    <div class="toolbar-left">
      <NuxtLink to="/dashboard" class="toolbar-btn-ghost" title="Retour au dashboard">
        <ArrowLeft :size="18" :stroke-width="2" />
      </NuxtLink>

      <button
        class="toolbar-btn-ghost"
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
      <div ref="modeDropdownRef" class="mode-dropdown">
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
      <SaveStatus
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
  height: 52px;
  padding: 0 12px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  width: 100%;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
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
  border-radius: 6px;
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
  border-radius: 6px;
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
  border-radius: 4px;
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

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}

/* Ghost buttons */
.toolbar-btn-ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 6px;
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

/* Responsive */
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
