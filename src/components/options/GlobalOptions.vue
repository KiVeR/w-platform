<script setup lang="ts">
import type { UserPalette } from '#shared/schemas/palette.schema'
import type { Palette } from '@/config/palettes'
import { ChevronDown, Copy, Moon, Pencil, Plus, RotateCcw, Save, Sun, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'
import ConfirmPaletteChangeModal from '@/components/ui/ConfirmPaletteChangeModal.vue'
import SavePaletteModal from '@/components/ui/SavePaletteModal.vue'
import { usePalettes } from '@/composables/usePalettes'
import { useEditorStore } from '@/stores/editor'
import OptionColorPicker from './shared/OptionColorPicker.vue'
import OptionGroup from './shared/OptionGroup.vue'
import OptionInput from './shared/OptionInput.vue'
import OptionSelect from './shared/OptionSelect.vue'
import OptionSlider from './shared/OptionSlider.vue'
import OptionTextarea from './shared/OptionTextarea.vue'

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
  duplicatePalette,
  renamePalette,
  deleteUserPalette,
} = usePalettes()

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

// Rename state
const renamingPaletteId = ref<string | null>(null)
const renameInput = ref('')

function toggleSection(section: keyof typeof expandedSections.value) {
  expandedSections.value[section] = !expandedSections.value[section]
}

function parsePixelValue(value: string | undefined, fallback: number): number {
  if (!value)
    return fallback
  return Number.parseInt(value.replace('px', ''), 10) || fallback
}

function handlePaletteClick(palette: Palette | UserPalette) {
  selectPalette(palette)
}

function handleDuplicate(palette: Palette | UserPalette) {
  duplicatePalette(palette)
}

function startRename(palette: UserPalette) {
  renamingPaletteId.value = palette.id
  renameInput.value = palette.label
}

function confirmRename(palette: UserPalette) {
  if (renameInput.value.trim()) {
    renamePalette(palette.id, renameInput.value.trim())
  }
  renamingPaletteId.value = null
}

function cancelRename() {
  renamingPaletteId.value = null
}

function handleDelete(palette: UserPalette) {
  // eslint-disable-next-line no-alert -- Confirmation before destructive action
  if (confirm(`Supprimer la palette "${palette.label}" ?`)) {
    deleteUserPalette(palette.id)
  }
}

function handleSaveModalConfirm(label: string) {
  saveAsNewPalette(label)
}

function handleConfirmModalSaveFirst() {
  showConfirmModal.value = false
  openSaveModal()
}

function isSelected(palette: Palette | UserPalette): boolean {
  return editorStore.globalStyles.palette === palette.name
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
        <!-- Current Palette State -->
        <div class="current-palette">
          <div class="current-palette-header">
            <span class="current-palette-name">
              {{ selectedPalette?.label || 'Aucune palette' }}
            </span>
            <span v-if="isPaletteModified" class="modified-indicator">
              ◉ (non enregistrée)
            </span>
          </div>

          <!-- Color Preview -->
          <div class="current-palette-preview">
            <div
              class="preview-swatch"
              :style="{ backgroundColor: currentColors.backgroundColor }"
              title="Fond"
            />
            <div
              class="preview-swatch"
              :style="{ backgroundColor: currentColors.textColor }"
              title="Texte"
            />
            <div
              class="preview-swatch"
              :style="{ backgroundColor: currentColors.primaryColor }"
              title="Primaire"
            />
            <div
              class="preview-swatch"
              :style="{ backgroundColor: currentColors.secondaryColor }"
              title="Secondaire"
            />
          </div>

          <!-- Actions -->
          <div class="current-palette-actions">
            <template v-if="isPaletteModified">
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
            </template>
            <span v-else class="status-synced">Palette synchronisée</span>
          </div>
        </div>

        <!-- User Palettes Section -->
        <div v-if="userPalettes.length > 0" class="palettes-section">
          <div class="palettes-section-header">
            <h4>Mes palettes</h4>
            <button class="add-palette-btn" title="Nouvelle palette" @click="openSaveModal">
              <Plus :size="14" />
            </button>
          </div>
          <div class="palette-grid">
            <div
              v-for="palette in userPalettes"
              :key="palette.id"
              class="palette-item"
              :class="{
                active: isSelected(palette),
                dark: palette.isDark,
              }"
            >
              <button
                class="palette-button"
                :aria-label="`Sélectionner la palette ${palette.label}`"
                :aria-pressed="isSelected(palette)"
                @click="handlePaletteClick(palette)"
              >
                <div class="palette-preview" :style="{ backgroundColor: palette.background }">
                  <div class="palette-color" :style="{ backgroundColor: palette.primary }" />
                  <div class="palette-color" :style="{ backgroundColor: palette.primaryDark }" />
                </div>
                <div class="palette-info">
                  <template v-if="renamingPaletteId === palette.id">
                    <input
                      v-model="renameInput"
                      class="rename-input"
                      type="text"
                      maxlength="100"
                      @click.stop
                      @keyup.enter="confirmRename(palette)"
                      @keyup.escape="cancelRename"
                      @blur="confirmRename(palette)"
                    >
                  </template>
                  <template v-else>
                    <span class="palette-label">{{ palette.label }}</span>
                    <Moon v-if="palette.isDark" :size="12" class="palette-icon" />
                    <Sun v-else :size="12" class="palette-icon" />
                  </template>
                </div>
              </button>
              <div class="palette-actions">
                <button
                  class="palette-action-btn"
                  title="Renommer"
                  @click.stop="startRename(palette)"
                >
                  <Pencil :size="12" />
                </button>
                <button
                  class="palette-action-btn"
                  title="Dupliquer"
                  @click.stop="handleDuplicate(palette)"
                >
                  <Copy :size="12" />
                </button>
                <button
                  class="palette-action-btn palette-action-btn-danger"
                  title="Supprimer"
                  @click.stop="handleDelete(palette)"
                >
                  <Trash2 :size="12" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Preset Palettes Section -->
        <div class="palettes-section">
          <div class="palettes-section-header">
            <h4>Prédéfinies</h4>
            <button
              v-if="userPalettes.length === 0"
              class="add-palette-btn"
              title="Nouvelle palette"
              @click="openSaveModal"
            >
              <Plus :size="14" />
            </button>
          </div>
          <div class="palette-grid">
            <div
              v-for="palette in presetPalettes"
              :key="palette.name"
              class="palette-item"
              :class="{
                active: isSelected(palette),
                dark: palette.isDark,
              }"
            >
              <button
                class="palette-button"
                :aria-label="`Sélectionner la palette ${palette.label}`"
                :aria-pressed="isSelected(palette)"
                @click="handlePaletteClick(palette)"
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
              <div class="palette-actions">
                <button
                  class="palette-action-btn"
                  title="Dupliquer"
                  @click.stop="handleDuplicate(palette)"
                >
                  <Copy :size="12" />
                </button>
              </div>
            </div>
          </div>
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

    <!-- Modals -->
    <SavePaletteModal
      v-if="showSaveModal"
      :current-colors="currentColors"
      @save="handleSaveModalConfirm"
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

/* Current Palette */
.current-palette {
  padding: var(--space-3);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.current-palette-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.current-palette-name {
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  color: var(--color-text);
}

.modified-indicator {
  font-size: var(--text-xs);
  color: #f59e0b;
  font-weight: var(--font-medium);
}

.current-palette-preview {
  display: flex;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
}

.preview-swatch {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.current-palette-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  min-height: 32px;
  align-items: center;
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
  color: white;
}

.status-synced {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

/* Palettes Section */
.palettes-section {
  margin-top: var(--space-2);
}

.palettes-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.palettes-section-header h4 {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.add-palette-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.add-palette-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(20, 184, 166, 0.05);
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-1);
}

.palette-item {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  transition: all var(--transition-fast);
}

.palette-item:hover {
  border-color: var(--color-primary);
}

.palette-item:hover .palette-actions {
  opacity: 1;
}

.palette-item.active {
  border-color: var(--color-primary);
  background: var(--color-primary-50);
}

.palette-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2);
  border: none;
  background: transparent;
  cursor: pointer;
  width: 100%;
}

.palette-button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
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

.palette-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.palette-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-surface-elevated);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.palette-action-btn:hover {
  background: var(--color-neutral-100);
  color: var(--color-primary);
}

.palette-action-btn-danger:hover {
  background: #fef2f2;
  color: #ef4444;
}

.rename-input {
  width: 80px;
  padding: 2px 4px;
  font-size: var(--text-xs);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  outline: none;
}
</style>
