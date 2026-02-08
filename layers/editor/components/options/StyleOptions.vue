<script setup lang="ts">
import type { Widget } from '../types/widget'
import { computed } from 'vue'

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

const opacities = [
  { value: '0.25', label: '25%' },
  { value: '0.5', label: '50%' },
  { value: '0.75', label: '75%' },
  { value: '1', label: '100%' },
]
</script>

<template>
  <div class="style-options">
    <!-- Typography (text color, bg color, font, size, spacing, transform) -->
    <StyleOptionsTypography
      v-if="hasTypographyStyles"
      :widget="widget"
      :is-button-widget="isButtonWidget"
      @update:style="updateStyle"
    />

    <!-- Width mode + Text Align -->
    <StyleOptionsAlignment
      v-if="hasTypographyStyles"
      :widget="widget"
      :is-button-widget="isButtonWidget"
      @update:style="updateStyle"
    />

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

    <!-- Border Color (for separator) -->
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

    <!-- Border Radius (for row) -->
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

    <!-- Advanced section (bg image, accent borders, external margin) -->
    <StyleOptionsContainerAdvanced
      v-if="hasContainerStyles"
      :widget="widget"
      @update:style="updateStyle"
    />
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
