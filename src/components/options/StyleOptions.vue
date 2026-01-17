<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { useWidgetsStore } from '@/stores/widgets'
import ColorPicker from './inputs/ColorPicker.vue'

const props = defineProps<{
  widget: Widget
}>()

const widgetsStore = useWidgetsStore()

function updateStyle(key: string, value: string) {
  widgetsStore.updateWidgetStyles(props.widget.id, { [key]: value })
}

const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px']
const textAligns = [
  { value: 'left', label: '⬅ Gauche' },
  { value: 'center', label: '↔ Centre' },
  { value: 'right', label: '➡ Droite' },
]
</script>

<template>
  <div class="style-options">
    <!-- Text Color (for title, text, button) -->
    <div v-if="['title', 'text', 'button', 'click-to-call'].includes(widget.type)" class="option-group">
      <label class="option-label">Couleur du texte</label>
      <ColorPicker
        :value="widget.styles.color || '#000000'"
        @update:value="updateStyle('color', $event)"
      />
    </div>

    <!-- Background Color (for button, click-to-call) -->
    <div v-if="['button', 'click-to-call'].includes(widget.type)" class="option-group">
      <label class="option-label">Couleur de fond</label>
      <ColorPicker
        :value="widget.styles.backgroundColor || '#14b8a6'"
        @update:value="updateStyle('backgroundColor', $event)"
      />
    </div>

    <!-- Font Size (for title, text, button) -->
    <div v-if="['title', 'text', 'button', 'click-to-call'].includes(widget.type)" class="option-group">
      <label class="option-label">Taille de police</label>
      <select
        class="option-select"
        :value="widget.styles.fontSize"
        @change="updateStyle('fontSize', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="size in fontSizes" :key="size" :value="size">
          {{ size }}
        </option>
      </select>
    </div>

    <!-- Text Align (for title, text) -->
    <div v-if="['title', 'text'].includes(widget.type)" class="option-group">
      <label class="option-label">Alignement</label>
      <div class="align-buttons">
        <button
          v-for="align in textAligns"
          :key="align.value"
          class="align-btn"
          :class="{ active: widget.styles.textAlign === align.value }"
          @click="updateStyle('textAlign', align.value)"
        >
          {{ align.label }}
        </button>
      </div>
    </div>

    <!-- Border Radius (for button, image) -->
    <div v-if="['button', 'click-to-call', 'image'].includes(widget.type)" class="option-group">
      <label class="option-label">Arrondi des coins</label>
      <div class="option-row">
        <input
          type="range"
          class="option-range"
          min="0"
          max="50"
          :value="parseInt(widget.styles.borderRadius || '8')"
          @input="updateStyle('borderRadius', `${($event.target as HTMLInputElement).value}px`)"
        >
        <span class="range-value">{{ widget.styles.borderRadius || '8px' }}</span>
      </div>
    </div>

    <!-- Border Color (for separator) -->
    <div v-if="widget.type === 'separator'" class="option-group">
      <label class="option-label">Couleur de la ligne</label>
      <ColorPicker
        :value="widget.styles.borderColor || '#e2e8f0'"
        @update:value="updateStyle('borderColor', $event)"
      />
    </div>

    <!-- Border Width (for separator) -->
    <div v-if="widget.type === 'separator'" class="option-group">
      <label class="option-label">Épaisseur</label>
      <div class="option-row">
        <input
          type="range"
          class="option-range"
          min="1"
          max="10"
          :value="parseInt(widget.styles.borderWidth || '1')"
          @input="updateStyle('borderWidth', `${($event.target as HTMLInputElement).value}px`)"
        >
        <span class="range-value">{{ widget.styles.borderWidth || '1px' }}</span>
      </div>
    </div>

    <!-- Padding -->
    <div class="option-group">
      <label class="option-label">Marge interne (padding)</label>
      <div class="option-row">
        <input
          type="range"
          class="option-range"
          min="0"
          max="48"
          :value="parseInt(widget.styles.padding || '16')"
          @input="updateStyle('padding', `${($event.target as HTMLInputElement).value}px`)"
        >
        <span class="range-value">{{ widget.styles.padding || '16px' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.style-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.option-select {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  background-color: var(--color-surface);
  cursor: pointer;
}

.option-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-range {
  flex: 1;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.range-value {
  font-size: 13px;
  color: var(--color-text-muted);
  min-width: 50px;
}

.align-buttons {
  display: flex;
  gap: 4px;
}

.align-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.align-btn:hover {
  border-color: var(--color-primary);
}

.align-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
</style>
