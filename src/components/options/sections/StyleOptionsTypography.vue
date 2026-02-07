<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { DESIGN_TOKENS, LETTER_SPACING_LABELS } from '#shared/constants/design-tokens'
import { getFontOptions } from '@/config/fonts'
import ColorPicker from '../inputs/ColorPicker.vue'
import ColorPickerWithTheme from '../inputs/ColorPickerWithTheme.vue'

defineProps<{
  widget: Widget
  isButtonWidget: boolean
}>()

const emit = defineEmits<{
  'update:style': [key: string, value: string | undefined]
}>()

function updateStyle(key: string, value: string | undefined) {
  emit('update:style', key, value)
}

const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px']
const textTransforms = [
  { value: 'none', label: 'Aa' },
  { value: 'uppercase', label: 'AA' },
  { value: 'lowercase', label: 'aa' },
  { value: 'capitalize', label: 'Ab' },
]
const fontOptions = getFontOptions()
const letterSpacings = DESIGN_TOKENS.letterSpacing
</script>

<template>
  <!-- Text Color -->
  <div class="option-group">
    <label class="option-label">Couleur du texte</label>
    <ColorPicker
      :value="widget.styles.color || '#000000'"
      @update:value="updateStyle('color', $event)"
    />
  </div>

  <!-- Background Color (buttons only) -->
  <div v-if="isButtonWidget" class="option-group">
    <label class="option-label">Couleur de fond</label>
    <ColorPickerWithTheme
      :value="widget.styles.backgroundColor"
      theme-color-type="primary"
      @update:value="updateStyle('backgroundColor', $event)"
    />
  </div>

  <!-- Font Family -->
  <div class="option-group">
    <label class="option-label">Police</label>
    <select
      class="option-select"
      :value="widget.styles.fontFamily || ''"
      @change="updateStyle('fontFamily', ($event.target as HTMLSelectElement).value || undefined)"
    >
      <option value="">
        Police globale
      </option>
      <option v-for="font in fontOptions" :key="font.value" :value="font.value">
        {{ font.label }}
      </option>
    </select>
  </div>

  <!-- Font Size -->
  <div class="option-group">
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

  <!-- Letter Spacing -->
  <div class="option-group">
    <label class="option-label">Espacement des lettres</label>
    <select
      class="option-select"
      :value="widget.styles.letterSpacing || '0'"
      @change="updateStyle('letterSpacing', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="value in letterSpacings" :key="value" :value="value">
        {{ LETTER_SPACING_LABELS[value] }}
      </option>
    </select>
  </div>

  <!-- Text Transform -->
  <div class="option-group">
    <label class="option-label">Casse du texte</label>
    <div class="align-buttons">
      <button
        v-for="transform in textTransforms"
        :key="transform.value"
        class="align-btn"
        :class="{ active: (widget.styles.textTransform || 'none') === transform.value }"
        :style="{ textTransform: transform.value }"
        @click="updateStyle('textTransform', transform.value)"
      >
        {{ transform.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
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
