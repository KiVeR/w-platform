<script setup lang="ts">
import type { EditorMode } from '@/stores/ui'
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

function handleSave() {
  // TODO: Implement save via API
  console.log('Saving...', editorStore.design)
  editorStore.markAsSaved()
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
        @click="uiStore.toggleLeftSidebar"
      >
        <span class="icon">☰</span>
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
        @click="handleUndo"
      >
        <span class="icon">↶</span>
      </button>

      <button
        class="toolbar-btn"
        :disabled="!historyStore.canRedo"
        title="Rétablir (Ctrl+Y)"
        @click="handleRedo"
      >
        <span class="icon">↷</span>
      </button>

      <button
        class="toolbar-btn save-btn"
        :disabled="!editorStore.isDirty"
        @click="handleSave"
      >
        <span class="icon">💾</span>
        <span class="btn-text">Sauvegarder</span>
      </button>

      <button
        class="toolbar-btn"
        :title="uiStore.rightSidebarOpen ? 'Masquer options' : 'Afficher options'"
        @click="uiStore.toggleRightSidebar"
      >
        <span class="icon">⚙</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
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
  border-radius: 8px;
  padding: 4px;
}

.mode-btn {
  padding: 8px 16px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all 0.2s;
}

.mode-btn:hover {
  color: var(--color-text);
}

.mode-btn.active {
  background-color: var(--color-primary);
  color: white;
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

.toolbar-btn .icon {
  font-size: 16px;
}

.save-btn {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.save-btn:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.btn-text {
  font-weight: 500;
}
</style>
