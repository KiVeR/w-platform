<script setup lang="ts">
import { ChevronDown, Plus, X } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  selectedPalette: Palette | UserPalette | undefined
  userPalettes: UserPalette[]
  presetPalettes: Palette[]
}>()

const emit = defineEmits<{
  select: [palette: Palette | UserPalette]
  delete: [id: string]
  rename: [id: string, newLabel: string]
  create: []
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const renamingId = ref<string | null>(null)
const renameInput = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

function handleDocumentPointerDown(event: MouseEvent) {
  const target = event.target
  if (!isOpen.value || !dropdownRef.value || !(target instanceof Node))
    return

  if (!dropdownRef.value.contains(target)) {
    isOpen.value = false
    cancelRename()
  }
}

const selectedLabel = computed(() => props.selectedPalette?.label || 'Aucune palette')

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (!isOpen.value) {
    cancelRename()
  }
}

function selectPalette(palette: Palette | UserPalette) {
  emit('select', palette)
  isOpen.value = false
}

function isSelected(palette: Palette | UserPalette): boolean {
  return props.selectedPalette?.name === palette.name
}

function startRename(palette: UserPalette, event: MouseEvent) {
  event.stopPropagation()
  renamingId.value = palette.id
  renameInput.value = palette.label
  nextTick(() => {
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  })
}

function confirmRename() {
  if (renamingId.value && renameInput.value.trim()) {
    emit('rename', renamingId.value, renameInput.value.trim())
  }
  renamingId.value = null
}

function cancelRename() {
  renamingId.value = null
}

function handleDelete(palette: UserPalette, event: MouseEvent) {
  event.stopPropagation()
  // eslint-disable-next-line no-alert -- Confirmation before destructive action
  if (confirm(`Supprimer la palette "${palette.label}" ?`)) {
    emit('delete', palette.id)
  }
}

function handleCreate() {
  emit('create')
  isOpen.value = false
}

watch(isOpen, (open) => {
  if (!open) {
    cancelRename()
  }
})

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentPointerDown)
})
</script>

<template>
  <div ref="dropdownRef" class="palette-dropdown">
    <!-- Trigger -->
    <button
      class="dropdown-trigger"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggleDropdown"
    >
      <span class="trigger-label">{{ selectedLabel }}</span>
      <div v-if="selectedPalette" class="trigger-preview">
        <div class="preview-swatch" :style="{ backgroundColor: selectedPalette.background }" />
        <div class="preview-swatch" :style="{ backgroundColor: selectedPalette.text }" />
        <div class="preview-swatch" :style="{ backgroundColor: selectedPalette.primary }" />
        <div class="preview-swatch" :style="{ backgroundColor: selectedPalette.primaryDark }" />
      </div>
      <ChevronDown :size="14" class="trigger-chevron" :class="{ open: isOpen }" />
    </button>

    <!-- Dropdown Panel -->
    <div v-if="isOpen" class="dropdown-panel" role="listbox">
      <!-- User Palettes Section -->
      <div v-if="userPalettes.length > 0" class="palette-group">
        <div class="group-header">
          <span>Mes palettes</span>
          <button class="create-btn" title="Nouvelle palette" @click="handleCreate">
            <Plus :size="12" />
            <span>Créer</span>
          </button>
        </div>
        <div class="palette-list">
          <div
            v-for="palette in userPalettes"
            :key="palette.id"
            class="palette-option"
            :class="{ selected: isSelected(palette) }"
            role="option"
            :aria-selected="isSelected(palette)"
            @click="selectPalette(palette)"
          >
            <!-- Rename input mode -->
            <template v-if="renamingId === palette.id">
              <input
                ref="renameInputRef"
                v-model="renameInput"
                class="rename-input"
                type="text"
                maxlength="100"
                @click.stop
                @keyup.enter="confirmRename"
                @keyup.escape="cancelRename"
                @blur="confirmRename"
              >
            </template>
            <!-- Normal display mode -->
            <template v-else>
              <span
                class="option-label"
                title="Double-clic pour renommer"
                @dblclick="startRename(palette, $event)"
              >
                {{ palette.label }}
              </span>
            </template>
            <div class="option-preview">
              <div class="preview-swatch" :style="{ backgroundColor: palette.background }" />
              <div class="preview-swatch" :style="{ backgroundColor: palette.text }" />
              <div class="preview-swatch" :style="{ backgroundColor: palette.primary }" />
              <div class="preview-swatch" :style="{ backgroundColor: palette.primaryDark }" />
            </div>
            <button
              class="delete-btn"
              title="Supprimer"
              @click="handleDelete(palette, $event)"
            >
              <X :size="12" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state for user palettes -->
      <div v-else class="palette-group">
        <div class="group-header">
          <span>Mes palettes</span>
          <button class="create-btn" title="Nouvelle palette" @click="handleCreate">
            <Plus :size="12" />
            <span>Créer</span>
          </button>
        </div>
        <div class="empty-state">
          Aucune palette personnalisée
        </div>
      </div>

      <!-- Preset Palettes Section -->
      <div class="palette-group">
        <div class="group-header">
          <span>Prédéfinies</span>
        </div>
        <div class="palette-list">
          <div
            v-for="palette in presetPalettes"
            :key="palette.name"
            class="palette-option"
            :class="{ selected: isSelected(palette) }"
            role="option"
            :aria-selected="isSelected(palette)"
            @click="selectPalette(palette)"
          >
            <span class="option-label">{{ palette.label }}</span>
            <div class="option-preview">
              <div class="preview-swatch" :style="{ backgroundColor: palette.background }" />
              <div class="preview-swatch" :style="{ backgroundColor: palette.text }" />
              <div class="preview-swatch" :style="{ backgroundColor: palette.primary }" />
              <div class="preview-swatch" :style="{ backgroundColor: palette.primaryDark }" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.palette-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dropdown-trigger:hover {
  border-color: var(--color-primary);
}

.dropdown-trigger:focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.trigger-label {
  flex: 1;
  text-align: left;
  font-size: var(--text-sm);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trigger-preview {
  display: flex;
  gap: 2px;
}

.trigger-preview .preview-swatch {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.trigger-chevron {
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);
}

.trigger-chevron.open {
  transform: rotate(180deg);
}

/* Dropdown Panel */
.dropdown-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 320px;
  overflow-y: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 50;
}

/* Palette Groups */
.palette-group {
  padding: var(--space-2);
}

.palette-group + .palette-group {
  border-top: 1px solid var(--color-border);
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-1) var(--space-2);
  margin-bottom: var(--space-1);
}

.group-header span {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.create-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 5%, transparent);
}

/* Palette List */
.palette-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.palette-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.palette-option:hover {
  background: var(--color-neutral-100);
}

.palette-option.selected {
  background: var(--color-primary-50);
}

.option-label {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-preview {
  display: flex;
  gap: 2px;
}

.option-preview .preview-swatch {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);
}

.palette-option:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: var(--color-error-50);
  color: var(--color-error-500);
}

/* Rename Input */
.rename-input {
  flex: 1;
  padding: 2px 4px;
  font-size: var(--text-sm);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  outline: none;
  background: var(--color-surface);
}

/* Empty State */
.empty-state {
  padding: var(--space-3);
  text-align: center;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
