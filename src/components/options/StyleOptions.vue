<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { DESIGN_TOKENS, LETTER_SPACING_LABELS } from '#shared/constants/design-tokens'
import { computed, ref } from 'vue'
import { getFontOptions } from '@/config/fonts'
import { useWidgetsStore } from '@/stores/widgets'
import ColorPicker from './inputs/ColorPicker.vue'
import ColorPickerWithTheme from './inputs/ColorPickerWithTheme.vue'
import OptionInput from './shared/OptionInput.vue'
import OptionSelect from './shared/OptionSelect.vue'
import ShadowPicker from './shared/ShadowPicker.vue'

const props = defineProps<{
  widget: Widget
}>()

const widgetsStore = useWidgetsStore()

function updateStyle(key: string, value: string | undefined) {
  widgetsStore.updateWidgetStyles(props.widget.id, { [key]: value })
}

// Widget type groups for conditional rendering
const TYPOGRAPHY_WIDGETS = ['title', 'text', 'button', 'click-to-call', 'testimonial', 'badge']
const BUTTON_WIDGETS = ['button', 'click-to-call']
const SHADOW_WIDGETS = ['button', 'click-to-call', 'image', 'row', 'column']
const OPACITY_WIDGETS = ['image', 'icon', 'separator', 'spacer']

const CONTAINER_WIDGETS = ['row', 'column']

const hasTypographyStyles = computed(() => TYPOGRAPHY_WIDGETS.includes(props.widget.type))
const isButtonWidget = computed(() => BUTTON_WIDGETS.includes(props.widget.type))
const hasShadowStyles = computed(() => SHADOW_WIDGETS.includes(props.widget.type))
const hasOpacityStyles = computed(() => OPACITY_WIDGETS.includes(props.widget.type))
const hasContainerStyles = computed(() => CONTAINER_WIDGETS.includes(props.widget.type))

// Advanced section state
const showAdvanced = ref(false)
const hasActiveAdvancedFeatures = computed(() =>
  !!(props.widget.styles.backgroundImage || getActiveBorderSides().length > 0),
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
const fontOptions = getFontOptions()
const letterSpacings = DESIGN_TOKENS.letterSpacing

// Container advanced options data
const bgSizeOptions = [
  { value: 'cover', label: 'Couvrir' },
  { value: 'contain', label: 'Contenir' },
  { value: 'auto', label: 'Auto' },
]
const bgPositionOptions = [
  { value: 'center', label: 'Centre' },
  { value: 'top', label: 'Haut' },
  { value: 'bottom', label: 'Bas' },
  { value: 'left', label: 'Gauche' },
  { value: 'right', label: 'Droite' },
]
const BORDER_SIDES = ['borderLeft', 'borderRight', 'borderTop', 'borderBottom'] as const
const borderSideChips = [
  { key: 'borderLeft', label: '←', title: 'Gauche' },
  { key: 'borderRight', label: '→', title: 'Droite' },
  { key: 'borderTop', label: '↑', title: 'Haut' },
  { key: 'borderBottom', label: '↓', title: 'Bas' },
]

// Container helpers
function updateBackgroundImageUrl(url: string) {
  updateStyle('backgroundImage', url ? `url(${url})` : undefined)
}

function getBackgroundImageUrl(): string {
  return props.widget.styles.backgroundImage?.match(/url\(['"]?(.+?)['"]?\)/)?.[1] || ''
}

function getActiveBorderSides(): string[] {
  return BORDER_SIDES.filter(side => props.widget.styles[side])
}

function isBorderSideActive(side: string): boolean {
  return !!props.widget.styles[side]
}

function toggleBorderSide(side: string) {
  if (isBorderSideActive(side)) {
    updateStyle(side, undefined)
  }
  else {
    const width = getBorderWidth()
    const color = getBorderColor()
    updateStyle(side, `${width}px solid ${color}`)
  }
}

function toggleAllBorders() {
  const activeSides = getActiveBorderSides()
  if (activeSides.length === BORDER_SIDES.length) {
    for (const side of BORDER_SIDES) {
      updateStyle(side, undefined)
    }
  }
  else {
    const width = getBorderWidth()
    const color = getBorderColor()
    for (const side of BORDER_SIDES) {
      if (!props.widget.styles[side]) {
        updateStyle(side, `${width}px solid ${color}`)
      }
    }
  }
}

function updateBorderWidth(width: string) {
  const color = getBorderColor()
  for (const side of getActiveBorderSides()) {
    updateStyle(side, `${width}px solid ${color}`)
  }
}

function updateBorderColor(color: string) {
  const width = getBorderWidth()
  for (const side of getActiveBorderSides()) {
    updateStyle(side, `${width}px solid ${color}`)
  }
}

function getBorderWidth(): string {
  const firstActive = getActiveBorderSides()[0]
  if (!firstActive) {
    return '3'
  }
  return props.widget.styles[firstActive]?.match(/^(\d+)px/)?.[1] || '3'
}

function getBorderColor(): string {
  const firstActive = getActiveBorderSides()[0]
  if (!firstActive) {
    return '#d4a041'
  }
  return props.widget.styles[firstActive]?.match(/(#[0-9a-f]{3,8})/i)?.[1] || '#d4a041'
}
</script>

<template>
  <div class="style-options">
    <!-- Text Color (for title, text, button) -->
    <div v-if="hasTypographyStyles" class="option-group">
      <label class="option-label">Couleur du texte</label>
      <ColorPicker
        :value="widget.styles.color || '#000000'"
        @update:value="updateStyle('color', $event)"
      />
    </div>

    <!-- Background Color (for button, click-to-call) - with theme toggle -->
    <div v-if="isButtonWidget" class="option-group">
      <label class="option-label">Couleur de fond</label>
      <ColorPickerWithTheme
        :value="widget.styles.backgroundColor"
        theme-color-type="primary"
        @update:value="updateStyle('backgroundColor', $event)"
      />
    </div>

    <!-- Font Family (for title, text, button, testimonial, badge) -->
    <div v-if="hasTypographyStyles" class="option-group">
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
    <div v-if="isButtonWidget" class="option-group">
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
      v-if="['title', 'text'].includes(widget.type) || (isButtonWidget && widget.styles.widthMode === 'auto')"
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

    <!-- Border Radius (for button, click-to-call, image) -->
    <div v-if="isButtonWidget || widget.type === 'image'" class="option-group">
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

    <!-- ===== CONTAINER-SPECIFIC STYLES ===== -->

    <!-- Background Color (for row, column) -->
    <div v-if="hasContainerStyles" class="option-group">
      <label class="option-label">Couleur de fond</label>
      <ColorPicker
        :value="widget.styles.backgroundColor || 'transparent'"
        @update:value="updateStyle('backgroundColor', $event)"
      />
    </div>

    <!-- Border Radius (for row — column already has it via image group) -->
    <div v-if="widget.type === 'row'" class="option-group">
      <label class="option-label">Arrondi des coins</label>
      <div class="option-row">
        <input
          type="range"
          class="option-range"
          min="0"
          max="50"
          :value="Number.parseInt(widget.styles.borderRadius || '0')"
          @input="updateStyle('borderRadius', `${($event.target as HTMLInputElement).value}px`)"
        >
        <span class="range-value">{{ widget.styles.borderRadius || '0px' }}</span>
      </div>
    </div>

    <!-- ===== ADVANCED SECTION (collapsible) ===== -->
    <div v-if="hasContainerStyles" class="advanced-section">
      <button class="advanced-toggle" @click="showAdvanced = !showAdvanced">
        <span class="advanced-toggle-icon">{{ showAdvanced ? '▼' : '▶' }}</span>
        Avancé
        <span v-if="hasActiveAdvancedFeatures" class="advanced-badge">●</span>
      </button>

      <div v-if="showAdvanced" class="advanced-content">
        <!-- Background image — progressive disclosure -->
        <div class="option-group">
          <label class="option-label">Image de fond</label>
          <OptionInput
            :model-value="getBackgroundImageUrl()"
            type="url"
            placeholder="https://exemple.com/image.jpg"
            @update:model-value="updateBackgroundImageUrl($event)"
          />
        </div>
        <!-- Size/position controls — visible only when URL is set -->
        <template v-if="widget.styles.backgroundImage">
          <div class="option-group">
            <label class="option-label">Taille</label>
            <OptionSelect
              :model-value="widget.styles.backgroundSize || 'cover'"
              :options="bgSizeOptions"
              @update:model-value="updateStyle('backgroundSize', $event)"
            />
          </div>
          <div class="option-group">
            <label class="option-label">Position</label>
            <OptionSelect
              :model-value="widget.styles.backgroundPosition || 'center'"
              :options="bgPositionOptions"
              @update:model-value="updateStyle('backgroundPosition', $event)"
            />
          </div>
        </template>

        <!-- Accent border — toggle chips -->
        <div class="option-group">
          <label class="option-label">Bordure d'accent</label>
          <div role="group" aria-label="Côtés de bordure" class="border-chips">
            <button
              class="border-chip"
              :class="{ active: getActiveBorderSides().length === BORDER_SIDES.length }"
              :aria-pressed="getActiveBorderSides().length === BORDER_SIDES.length"
              aria-label="Sélectionner tous les côtés"
              @click="toggleAllBorders()"
            >
              Tous
            </button>
            <button
              v-for="chip in borderSideChips"
              :key="chip.key"
              class="border-chip"
              :class="{ active: isBorderSideActive(chip.key) }"
              :aria-pressed="isBorderSideActive(chip.key)"
              :title="chip.title"
              :aria-label="chip.title"
              @click="toggleBorderSide(chip.key)"
            >
              {{ chip.label }}
            </button>
          </div>
        </div>
        <!-- Border controls — visible when at least one side is active -->
        <template v-if="getActiveBorderSides().length > 0">
          <div class="option-group">
            <label class="option-label">Épaisseur</label>
            <div class="option-row">
              <input
                type="range"
                class="option-range"
                min="1"
                max="8"
                :value="getBorderWidth()"
                @input="updateBorderWidth(($event.target as HTMLInputElement).value)"
              >
              <span class="range-value">{{ getBorderWidth() }}px</span>
            </div>
          </div>
          <div class="option-group">
            <label class="option-label">Couleur bordure</label>
            <ColorPicker
              :value="getBorderColor()"
              @update:value="updateBorderColor($event)"
            />
          </div>
        </template>

        <!-- External margin -->
        <div class="option-group">
          <label class="option-label">Marge externe</label>
          <div class="option-row">
            <input
              type="range"
              class="option-range"
              min="0"
              max="48"
              :value="Number.parseInt(widget.styles.margin || '0')"
              @input="updateStyle('margin', `${($event.target as HTMLInputElement).value}px`)"
            >
            <span class="range-value">{{ widget.styles.margin || '0px' }}</span>
          </div>
        </div>
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

.advanced-section {
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
  margin-top: 4px;
}

.advanced-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 0;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.2s;
}

.advanced-toggle:hover {
  color: var(--color-text);
}

.advanced-toggle-icon {
  font-size: 10px;
  width: 12px;
}

.advanced-badge {
  color: var(--color-primary);
  font-size: 8px;
}

.advanced-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 12px;
}

.border-chips {
  display: flex;
  gap: 4px;
}

.border-chip {
  padding: 5px 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.border-chip:hover {
  border-color: var(--color-primary);
}

.border-chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
</style>
