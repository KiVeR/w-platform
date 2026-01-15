<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { palettes } from '@/config/palettes'
import ColorPicker from './inputs/ColorPicker.vue'

const editorStore = useEditorStore()

function selectPalette(paletteName: string) {
  const palette = palettes.find(p => p.name === paletteName)
  if (palette) {
    editorStore.updateGlobalStyles({
      palette: paletteName,
      backgroundColor: palette.background,
      textColor: palette.text
    })
  }
}
</script>

<template>
  <div class="global-options">
    <h3 class="section-title">Options générales de l'app</h3>

    <!-- Palette Selection -->
    <div class="option-group">
      <label class="option-label">Palette de couleurs</label>
      <div class="palette-grid">
        <button
          v-for="palette in palettes"
          :key="palette.name"
          class="palette-item"
          :class="{ active: editorStore.globalStyles.palette === palette.name }"
          @click="selectPalette(palette.name)"
        >
          <div class="palette-preview">
            <div class="palette-color" :style="{ backgroundColor: palette.primary }"></div>
            <div class="palette-color" :style="{ backgroundColor: palette.secondary }"></div>
          </div>
          <span class="palette-label">{{ palette.label }}</span>
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
  gap: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 4px 0;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.palette-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  cursor: pointer;
  transition: all 0.2s;
}

.palette-item:hover {
  border-color: var(--color-primary);
}

.palette-item.active {
  border-color: var(--color-primary);
  background: rgba(20, 184, 166, 0.05);
}

.palette-preview {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}

.palette-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.palette-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text);
}
</style>
