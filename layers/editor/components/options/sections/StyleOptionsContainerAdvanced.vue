<script setup lang="ts">
import type { Widget } from '../../types/widget'
import { computed, ref } from 'vue'
import ColorPicker from '../inputs/ColorPicker.vue'
import OptionInput from '../shared/OptionInput.vue'
import OptionSelect from '../shared/OptionSelect.vue'

const props = defineProps<{
  widget: Widget
}>()

const emit = defineEmits<{
  'update:style': [key: string, value: string | undefined]
}>()

function updateStyle(key: string, value: string | undefined) {
  emit('update:style', key, value)
}

const widgetStyles = computed(() => props.widget.styles)

const {
  BORDER_SIDES,
  borderSideChips,
  getActiveBorderSides,
  isBorderSideActive,
  getBorderWidth,
  getBorderColor,
  toggleBorderSide,
  toggleAllBorders,
  updateBorderWidth,
  updateBorderColor,
} = useContainerBorders(widgetStyles, updateStyle)

const showAdvanced = ref(false)
const hasActiveAdvancedFeatures = computed(() =>
  !!(props.widget.styles.backgroundImage || getActiveBorderSides().length > 0),
)

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

function updateBackgroundImageUrl(url: string) {
  updateStyle('backgroundImage', url ? `url(${url})` : undefined)
}

function getBackgroundImageUrl(): string {
  return props.widget.styles.backgroundImage?.match(/url\(['"]?(.+?)['"]?\)/)?.[1] || ''
}
</script>

<template>
  <div class="advanced-section">
    <button class="advanced-toggle" @click="showAdvanced = !showAdvanced">
      <span class="advanced-toggle-icon">{{ showAdvanced ? '▼' : '▶' }}</span>
      Avancé
      <span v-if="hasActiveAdvancedFeatures" class="advanced-badge">●</span>
    </button>

    <div v-if="showAdvanced" class="advanced-content">
      <!-- Background image -->
      <div class="option-group">
        <label class="option-label">Image de fond</label>
        <OptionInput
          :model-value="getBackgroundImageUrl()"
          type="url"
          placeholder="https://exemple.com/image.jpg"
          @update:model-value="updateBackgroundImageUrl($event)"
        />
      </div>
      <!-- Size/position controls -->
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
      <!-- Border controls -->
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
