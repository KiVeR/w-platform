<script setup lang="ts">
import { ChevronDown, RotateCcw, Save } from 'lucide-vue-next'
import { ref } from 'vue'
import ConfirmPaletteChangeModal from '@/components/ui/ConfirmPaletteChangeModal.vue'
import SavePaletteModal from '@/components/ui/SavePaletteModal.vue'
import { usePalettes } from '@/composables/usePalettes'
import { getFontOptions } from '@/config/fonts'
import { useEditorStore } from '@/stores/editor'
import OptionColorPicker from './shared/OptionColorPicker.vue'
import OptionGroup from './shared/OptionGroup.vue'
import OptionInput from './shared/OptionInput.vue'
import OptionSelect from './shared/OptionSelect.vue'
import OptionSlider from './shared/OptionSlider.vue'
import OptionTextarea from './shared/OptionTextarea.vue'
import PaletteDropdown from './shared/PaletteDropdown.vue'

const editorStore = useEditorStore()

const {
  userPalettes,
  presetPalettes,
  showSaveModal,
  showConfirmModal,
  currentColors,
  selectedPalette,
  isPaletteModified,
  isUserPalette,
  selectPalette,
  confirmPaletteChange,
  cancelPaletteChange,
  resetToOriginal,
  openSaveModal,
  closeSaveModal,
  saveAsNewPalette,
  updateCurrentPalette,
  renamePalette,
  deleteUserPalette,
} = usePalettes()

const expandedSections = ref({
  colors: true,
  typography: false,
  layout: false,
  seo: false,
})

const fontOptions = getFontOptions()

function toggleSection(section: keyof typeof expandedSections.value) {
  expandedSections.value[section] = !expandedSections.value[section]
}

function parsePixelValue(value: string | undefined, fallback: number): number {
  if (!value)
    return fallback
  return Number.parseInt(value.replace('px', ''), 10) || fallback
}

function handleConfirmModalSaveFirst() {
  showConfirmModal.value = false
  openSaveModal()
}
</script>

<template>
  <div class="global-options">
    <!-- Section: Couleurs (unifiée) -->
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
        <!-- Zone 1: Palette Selector -->
        <OptionGroup label="Palette">
          <PaletteDropdown
            :selected-palette="selectedPalette"
            :user-palettes="userPalettes"
            :preset-palettes="presetPalettes"
            @select="selectPalette"
            @rename="renamePalette"
            @delete="deleteUserPalette"
            @create="openSaveModal"
          />
        </OptionGroup>

        <!-- Zone 2: Modified Banner (conditional) -->
        <div v-if="isPaletteModified" class="modified-banner">
          <span class="modified-indicator">◉ Modifiée</span>
          <div class="modified-actions">
            <button class="action-btn" title="Réinitialiser" @click="resetToOriginal">
              <RotateCcw :size="14" />
              <span>Réinitialiser</span>
            </button>
            <button
              v-if="isUserPalette"
              class="action-btn action-btn-primary"
              title="Enregistrer"
              @click="updateCurrentPalette"
            >
              <Save :size="14" />
              <span>Enregistrer</span>
            </button>
            <button class="action-btn" title="Enregistrer sous..." @click="openSaveModal">
              <Save :size="14" />
              <span>{{ isUserPalette ? 'Enregistrer sous...' : 'Enregistrer...' }}</span>
            </button>
          </div>
        </div>

        <!-- Separator -->
        <div class="section-separator" />

        <!-- Zone 3: Color Pickers -->
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

    <!-- Modals -->
    <SavePaletteModal
      v-if="showSaveModal"
      :current-colors="currentColors"
      @save="saveAsNewPalette"
      @cancel="closeSaveModal"
    />

    <ConfirmPaletteChangeModal
      v-if="showConfirmModal"
      @confirm="confirmPaletteChange"
      @save-first="handleConfirmModalSaveFirst"
      @cancel="cancelPaletteChange"
    />
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

/* Section Separator */
.section-separator {
  height: 1px;
  background: var(--color-border);
  margin: var(--space-1) 0;
}

/* Modified Banner */
.modified-banner {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-md);
  animation: fade-in 0.2s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modified-indicator {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: #d97706;
}

.modified-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-neutral-100);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.action-btn-primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.action-btn-primary:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
  color: white;
}
</style>
