<script setup lang="ts">
import type { EditorMode } from '@/stores/ui'
import { Menu, Redo2, Settings, Undo2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import SaveButton from '@/components/ui/SaveButton.vue'
import { useEditorStore } from '@/stores/editor'
import { useHistoryStore } from '@/stores/history'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
const editorStore = useEditorStore()
const historyStore = useHistoryStore()

const modes: { value: EditorMode, label: string }[] = [
  { value: 'designer', label: 'Mode designer' },
  { value: 'preview', label: 'Mode aperçu' },
  { value: 'expert', label: 'Mode expert' },
]

const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

const currentSaveStatus = computed(() => {
  if (saveStatus.value !== 'idle')
    return saveStatus.value
  return editorStore.isDirty ? 'idle' : 'saved'
})

async function handleSave() {
  if (!editorStore.isDirty)
    return

  saveStatus.value = 'saving'
  try {
    // Simulate API save
    await new Promise(resolve => setTimeout(resolve, 800))
    editorStore.markAsSaved()
    saveStatus.value = 'saved'
    setTimeout(() => {
      saveStatus.value = 'idle'
    }, 2000)
  }
  catch {
    saveStatus.value = 'error'
    setTimeout(() => {
      saveStatus.value = 'idle'
    }, 3000)
  }
}

function handleUndo() {
  const previous = historyStore.undo()
  if (previous) {
    historyStore.pushToFuture(editorStore.design)
    editorStore.setDesign(previous)
  }
}

function handleRedo() {
  const next = historyStore.redo()
  if (next) {
    historyStore.pushState(editorStore.design)
    editorStore.setDesign(next)
  }
}
</script>

<template>
  <header class="toolbar">
    <div class="toolbar-left">
      <button
        class="toolbar-btn"
        :title="uiStore.leftSidebarOpen ? 'Masquer widgets' : 'Afficher widgets'"
        :aria-label="uiStore.leftSidebarOpen ? 'Masquer la palette de widgets' : 'Afficher la palette de widgets'"
        :aria-pressed="uiStore.leftSidebarOpen"
        @click="uiStore.toggleLeftSidebar"
      >
        <Menu :size="18" :stroke-width="2" />
      </button>

      <div class="toolbar-title">
        <span class="title">Éditeur Landing Page</span>
        <span v-if="editorStore.isDirty" class="dirty-indicator">•</span>
      </div>
    </div>

    <div class="toolbar-center">
      <div class="mode-switch">
        <button
          v-for="mode in modes"
          :key="mode.value"
          class="mode-btn"
          :class="{ active: uiStore.mode === mode.value }"
          @click="uiStore.setMode(mode.value)"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <div class="toolbar-right">
      <button
        class="toolbar-btn"
        :disabled="!historyStore.canUndo"
        title="Annuler (Ctrl+Z)"
        aria-label="Annuler"
        @click="handleUndo"
      >
        <Undo2 :size="18" :stroke-width="2" />
      </button>

      <button
        class="toolbar-btn"
        :disabled="!historyStore.canRedo"
        title="Rétablir (Ctrl+Y)"
        aria-label="Rétablir"
        @click="handleRedo"
      >
        <Redo2 :size="18" :stroke-width="2" />
      </button>

      <SaveButton
        :status="currentSaveStatus"
        :disabled="!editorStore.isDirty && saveStatus === 'idle'"
        @click="handleSave"
      />

      <button
        class="toolbar-btn"
        :title="uiStore.rightSidebarOpen ? 'Masquer options' : 'Afficher options'"
        :aria-label="uiStore.rightSidebarOpen ? 'Masquer le panneau d\'options' : 'Afficher le panneau d\'options'"
        :aria-pressed="uiStore.rightSidebarOpen"
        @click="uiStore.toggleRightSidebar"
      >
        <Settings :size="18" :stroke-width="2" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px; /* Explicit alignment height */
  padding: 0 16px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  width: 100%;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
}

.title {
  font-weight: 600;
  color: var(--color-text);
}

.dirty-indicator {
  color: var(--color-primary);
  font-size: 24px;
  line-height: 1;
}

.toolbar-center {
  display: flex;
  align-items: center;
}

.mode-switch {
  display: flex;
  background-color: var(--color-background);
  border-radius: 6px;
  padding: 2px;
  border: 1px solid var(--color-border);
}

.mode-btn {
  padding: 6px 12px;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all 0.2s ease;
  min-width: 100px; /* Ensure uniform width */
  text-align: center;
}

.mode-btn:hover {
  color: var(--color-text);
}

.mode-btn.active {
  background-color: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text);
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background-color: var(--color-background);
  border-color: var(--color-primary);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn svg {
  flex-shrink: 0;
}

.toolbar-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
</style>
