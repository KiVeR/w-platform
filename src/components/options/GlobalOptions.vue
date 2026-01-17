<script setup lang="ts">
import type { Palette } from '@/config/palettes'
import { Moon, Sun } from 'lucide-vue-next'
import { palettes } from '@/config/palettes'
import { useEditorStore } from '@/stores/editor'
import ColorPicker from './inputs/ColorPicker.vue'

const editorStore = useEditorStore()

function selectPalette(palette: Palette) {
  editorStore.updateGlobalStyles({
    palette: palette.name,
    backgroundColor: palette.background,
    textColor: palette.text,
  })
}
</script>

<template>
  <div class="global-options">
    <h3 class="section-title">
      Options générales de l'app
    </h3>

    <!-- Palette Selection -->
    <div class="option-group">
      <label class="option-label">Palette de couleurs</label>
      <div class="palette-grid">
        <button
          v-for="palette in palettes"
          :key="palette.name"
          class="palette-item"
          :class="{
            active: editorStore.globalStyles.palette === palette.name,
            dark: palette.isDark,
          }"
          :aria-label="`Sélectionner la palette ${palette.label}`"
          :aria-pressed="editorStore.globalStyles.palette === palette.name"
          @click="selectPalette(palette)"
        >
          <div class="palette-preview" :style="{ backgroundColor: palette.background }">
            <div class="palette-color" :style="{ backgroundColor: palette.primary }" />
            <div class="palette-color" :style="{ backgroundColor: palette.primaryDark }" />
          </div>
          <div class="palette-info">
            <span class="palette-label">{{ palette.label }}</span>
            <Moon v-if="palette.isDark" :size="12" class="palette-icon" />
            <Sun v-else :size="12" class="palette-icon" />
          </div>
        </button>
      </div>
    </div>

    <!-- Background Color -->
    <div class="option-group">
      <label class="option-label">Couleur de fond</label>
      <ColorPicker
        :value="editorStore.globalStyles.backgroundColor"
        @update:value="editorStore.updateGlobalStyles({ backgroundColor: $event })"
      />
    </div>

    <!-- Text Color -->
    <div class="option-group">
      <label class="option-label">Couleur du texte</label>
      <ColorPicker
        :value="editorStore.globalStyles.textColor"
        @update:value="editorStore.updateGlobalStyles({ textColor: $event })"
      />
    </div>
  </div>
</template>

<style scoped>
.global-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin: 0;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.option-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-1);
}

.palette-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.palette-item:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.palette-item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.palette-item.active {
  border-color: var(--color-primary);
  background: var(--color-primary-50);
}

.palette-preview {
  display: flex;
  gap: var(--space-1);
  margin-bottom: var(--space-1);
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.palette-color {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
}

.palette-info {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.palette-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.palette-icon {
  color: var(--color-text-muted);
}

.palette-item.dark .palette-label {
  color: var(--color-text-secondary);
}
</style>
