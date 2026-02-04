<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { DESIGN_TOKENS, LETTER_SPACING_LABELS } from '#shared/constants/design-tokens'
import { computed } from 'vue'
import { useWidgetsStore } from '@/stores/widgets'
import ColorPicker from './inputs/ColorPicker.vue'
import ColorPickerWithTheme from './inputs/ColorPickerWithTheme.vue'
import ShadowPicker from './shared/ShadowPicker.vue'

const props = defineProps<{
  widget: Widget
}>()

const widgetsStore = useWidgetsStore()

function updateStyle(key: string, value: string | undefined) {
  widgetsStore.updateWidgetStyles(props.widget.id, { [key]: value })
}

// Widget type groups for conditional rendering
const hasTypographyStyles = computed(() =>
  ['title', 'text', 'button', 'click-to-call'].includes(props.widget.type),
)

const hasShadowStyles = computed(() =>
  ['button', 'click-to-call', 'image', 'row', 'column'].includes(props.widget.type),
)

const hasOpacityStyles = computed(() =>
  ['image', 'icon', 'separator', 'spacer'].includes(props.widget.type),
)

// Options data
const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px']
const textAligns = [
  { value: 'left', label: '⬅ Gauche' },
  { value: 'center', label: '↔ Centre' },
  { value: 'right', label: '➡ Droite' },
]
const widthModes = [
  { value: 'auto', label: 'Auto' },
  { value: 'full', label: 'Pleine largeur' },
]
const textTransforms = [
  { value: 'none', label: 'Aa' },
  { value: 'uppercase', label: 'AA' },
  { value: 'lowercase', label: 'aa' },
  { value: 'capitalize', label: 'Ab' },
]
const opacities = [
  { value: '0.25', label: '25%' },
  { value: '0.5', label: '50%' },
  { value: '0.75', label: '75%' },
  { value: '1', label: '100%' },
]
const letterSpacings = DESIGN_TOKENS.letterSpacing
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

    <!-- Background Color (for button, click-to-call) - with theme toggle -->
    <div v-if="['button', 'click-to-call'].includes(widget.type)" class="option-group">
      <label class="option-label">Couleur de fond</label>
      <ColorPickerWithTheme
        :value="widget.styles.backgroundColor"
        theme-color-type="primary"
        @update:value="updateStyle('backgroundColor', $event)"
      />
    </div>

    <!-- Font Size (for title, text, button) -->
    <div v-if="hasTypographyStyles" class="option-group">
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

    <!-- Letter Spacing (for title, text, button) -->
    <div v-if="hasTypographyStyles" class="option-group">
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

    <!-- Text Transform (for title, text, button) -->
    <div v-if="hasTypographyStyles" class="option-group">
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

    <!-- Width Mode (for button, click-to-call) -->
    <div v-if="['button', 'click-to-call'].includes(widget.type)" class="option-group">
      <label class="option-label">Largeur</label>
      <div class="align-buttons">
        <button
          v-for="mode in widthModes"
          :key="mode.value"
          class="align-btn"
          :class="{ active: (widget.styles.widthMode || 'full') === mode.value }"
          @click="updateStyle('widthMode', mode.value)"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <!-- Text Align (for title, text, and button/click-to-call when not full width) -->
    <div
      v-if="['title', 'text'].includes(widget.type)
        || (['button', 'click-to-call'].includes(widget.type) && widget.styles.widthMode === 'auto')"
      class="option-group"
    >
      <label class="option-label">Alignement</label>
      <div class="align-buttons">
        <button
          v-for="align in textAligns"
          :key="align.value"
          class="align-btn"
          :class="{ active: (widget.styles.textAlign || 'center') === align.value }"
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

    <!-- Box Shadow (for button, image, row, column) -->
    <div v-if="hasShadowStyles" class="option-group">
      <label class="option-label">Ombre</label>
      <ShadowPicker
        :model-value="widget.styles.boxShadow"
        @update:model-value="updateStyle('boxShadow', $event)"
      />
    </div>

    <!-- Opacity (for image, icon, separator, spacer) -->
    <div v-if="hasOpacityStyles" class="option-group">
      <label class="option-label">Opacité</label>
      <div class="align-buttons">
        <button
          v-for="op in opacities"
          :key="op.value"
          class="align-btn"
          :class="{ active: (widget.styles.opacity || '1') === op.value }"
          @click="updateStyle('opacity', op.value)"
        >
          {{ op.label }}
        </button>
      </div>
    </div>

    <!-- Border Color (for separator) - with theme toggle -->
    <div v-if="widget.type === 'separator'" class="option-group">
      <label class="option-label">Couleur de la ligne</label>
      <ColorPickerWithTheme
        :value="widget.styles.borderColor"
        theme-color-type="secondary"
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
