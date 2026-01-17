<script setup lang="ts">
import type { Palette } from '@/config/palettes'
import { ChevronDown, Moon, Sun } from 'lucide-vue-next'
import { ref } from 'vue'
import { palettes } from '@/config/palettes'
import { useEditorStore } from '@/stores/editor'
import OptionColorPicker from './shared/OptionColorPicker.vue'
import OptionGroup from './shared/OptionGroup.vue'
import OptionInput from './shared/OptionInput.vue'
import OptionSelect from './shared/OptionSelect.vue'
import OptionSlider from './shared/OptionSlider.vue'
import OptionTextarea from './shared/OptionTextarea.vue'

const editorStore = useEditorStore()

const expandedSections = ref({
  palette: true,
  colors: true,
  typography: false,
  layout: false,
  seo: false,
})

const fontOptions = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Playfair Display, serif', label: 'Playfair Display' },
]

function selectPalette(palette: Palette) {
  editorStore.updateGlobalStyles({
    palette: palette.name,
    backgroundColor: palette.background,
    textColor: palette.text,
    primaryColor: palette.primary,
    secondaryColor: palette.primaryDark,
  })
}

function toggleSection(section: keyof typeof expandedSections.value) {
  expandedSections.value[section] = !expandedSections.value[section]
}

function parsePixelValue(value: string | undefined, fallback: number): number {
  if (!value)
    return fallback
  return Number.parseInt(value.replace('px', ''), 10) || fallback
}
</script>

<template>
  <div class="global-options">
    <!-- Section: Palette -->
    <section class="options-section">
      <button
        class="section-header"
        :aria-expanded="expandedSections.palette"
        @click="toggleSection('palette')"
      >
        <span>Palette de couleurs</span>
        <ChevronDown :size="16" :class="{ rotated: !expandedSections.palette }" />
      </button>
      <div v-show="expandedSections.palette" class="section-content">
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
    </section>

    <!-- Section: Colors -->
    <section class="options-section">
      <button
        class="section-header"
        :aria-expanded="expandedSections.colors"
        @click="toggleSection('colors')"
      >
        <span>Couleurs</span>
        <ChevronDown :size="16" :class="{ rotated: !expandedSections.colors }" />
      </button>
      <div v-show="expandedSections.colors" class="section-content">
        <OptionGroup label="Couleur de fond">
          <OptionColorPicker
            :model-value="editorStore.globalStyles.backgroundColor"
            @update:model-value="editorStore.updateGlobalStyles({ backgroundColor: $event })"
          />
        </OptionGroup>
        <OptionGroup label="Couleur du texte">
          <OptionColorPicker
            :model-value="editorStore.globalStyles.textColor"
            @update:model-value="editorStore.updateGlobalStyles({ textColor: $event })"
          />
        </OptionGroup>
        <OptionGroup label="Couleur principale" hint="Boutons, liens, accents">
          <OptionColorPicker
            :model-value="editorStore.globalStyles.primaryColor"
            @update:model-value="editorStore.updateGlobalStyles({ primaryColor: $event })"
          />
        </OptionGroup>
        <OptionGroup label="Couleur secondaire">
          <OptionColorPicker
            :model-value="editorStore.globalStyles.secondaryColor"
            @update:model-value="editorStore.updateGlobalStyles({ secondaryColor: $event })"
          />
        </OptionGroup>
      </div>
    </section>

    <!-- Section: Typography -->
    <section class="options-section">
      <button
        class="section-header"
        :aria-expanded="expandedSections.typography"
        @click="toggleSection('typography')"
      >
        <span>Typographie</span>
        <ChevronDown :size="16" :class="{ rotated: !expandedSections.typography }" />
      </button>
      <div v-show="expandedSections.typography" class="section-content">
        <OptionGroup label="Police du corps">
          <OptionSelect
            :model-value="editorStore.globalStyles.fontFamily"
            :options="fontOptions"
            @update:model-value="editorStore.updateGlobalStyles({ fontFamily: $event })"
          />
        </OptionGroup>
        <OptionGroup label="Police des titres">
          <OptionSelect
            :model-value="editorStore.globalStyles.headingFontFamily"
            :options="fontOptions"
            @update:model-value="editorStore.updateGlobalStyles({ headingFontFamily: $event })"
          />
        </OptionGroup>
        <OptionGroup label="Taille de base">
          <OptionSlider
            :model-value="parsePixelValue(editorStore.globalStyles.baseFontSize, 16)"
            :min="12"
            :max="24"
            unit="px"
            @update:model-value="editorStore.updateGlobalStyles({ baseFontSize: `${$event}px` })"
          />
        </OptionGroup>
        <OptionGroup label="Hauteur de ligne">
          <OptionSlider
            :model-value="Number(editorStore.globalStyles.lineHeight || 1.6) * 10"
            :min="10"
            :max="25"
            :step="1"
            @update:model-value="editorStore.updateGlobalStyles({ lineHeight: String($event / 10) })"
          />
        </OptionGroup>
      </div>
    </section>

    <!-- Section: Layout -->
    <section class="options-section">
      <button
        class="section-header"
        :aria-expanded="expandedSections.layout"
        @click="toggleSection('layout')"
      >
        <span>Mise en page</span>
        <ChevronDown :size="16" :class="{ rotated: !expandedSections.layout }" />
      </button>
      <div v-show="expandedSections.layout" class="section-content">
        <OptionGroup label="Marge interne par défaut">
          <OptionSlider
            :model-value="parsePixelValue(editorStore.globalStyles.contentPadding, 16)"
            :min="0"
            :max="48"
            unit="px"
            @update:model-value="editorStore.updateGlobalStyles({ contentPadding: `${$event}px` })"
          />
        </OptionGroup>
        <OptionGroup label="Espacement entre widgets">
          <OptionSlider
            :model-value="parsePixelValue(editorStore.globalStyles.widgetGap, 12)"
            :min="0"
            :max="32"
            unit="px"
            @update:model-value="editorStore.updateGlobalStyles({ widgetGap: `${$event}px` })"
          />
        </OptionGroup>
        <OptionGroup label="Arrondi par défaut">
          <OptionSlider
            :model-value="parsePixelValue(editorStore.globalStyles.borderRadius, 8)"
            :min="0"
            :max="24"
            unit="px"
            @update:model-value="editorStore.updateGlobalStyles({ borderRadius: `${$event}px` })"
          />
        </OptionGroup>
      </div>
    </section>

    <!-- Section: SEO -->
    <section class="options-section">
      <button
        class="section-header"
        :aria-expanded="expandedSections.seo"
        @click="toggleSection('seo')"
      >
        <span>SEO & Meta</span>
        <ChevronDown :size="16" :class="{ rotated: !expandedSections.seo }" />
      </button>
      <div v-show="expandedSections.seo" class="section-content">
        <OptionGroup label="Titre de la page">
          <OptionInput
            :model-value="editorStore.globalStyles.pageTitle || ''"
            placeholder="Mon landing page"
            @update:model-value="editorStore.updateGlobalStyles({ pageTitle: $event })"
          />
        </OptionGroup>
        <OptionGroup label="Description meta">
          <OptionTextarea
            :model-value="editorStore.globalStyles.metaDescription || ''"
            placeholder="Description pour les moteurs de recherche..."
            :rows="3"
            @update:model-value="editorStore.updateGlobalStyles({ metaDescription: $event })"
          />
        </OptionGroup>
      </div>
    </section>
  </div>
</template>

<style scoped>
.global-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.options-section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-3);
  border: none;
  background: var(--color-surface-elevated);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.section-header:hover {
  background: var(--color-neutral-100);
}

.section-header svg {
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);
}

.section-header svg.rotated {
  transform: rotate(-90deg);
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
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
