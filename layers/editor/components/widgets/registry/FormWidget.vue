<script setup lang="ts">
import type { Widget, WidgetType } from '../../types/widget'
import { ClipboardList } from 'lucide-vue-next'
import { computed } from 'vue'
import draggable from 'vuedraggable'

const props = defineProps<{
  widget: Widget
  editable?: boolean
  readonly?: boolean
}>()

const widgetsStore = useWidgetsStore()
const selectionStore = useSelectionStore()
const { primaryColor, borderRadius } = useGlobalStyles()

const children = computed({
  get: () => props.widget.children || [],
  set: (value) => {
    widgetsStore.updateWidgetChildren(props.widget.id, value)
  },
})

const formStyle = computed(() => ({
  padding: props.widget.styles.padding,
  margin: props.widget.styles.margin,
  backgroundColor: props.widget.styles.backgroundColor,
  borderRadius: props.widget.styles.borderRadius,
}))

const submitButtonStyle = computed(() => ({
  backgroundColor: primaryColor.value,
  borderRadius: borderRadius.value,
}))

// En mode preview, filtrer les enfants non configures
const configuredChildren = computed(() =>
  children.value.filter(isWidgetConfigured),
)

function addField() {
  widgetsStore.addChildWidget(props.widget.id, 'form-field')
}

function handleSubmit(event: Event) {
  event.preventDefault()
}

function handleDrop(event: DragEvent): void {
  event.preventDefault()
  event.stopPropagation()

  const widgetType = event.dataTransfer?.getData('widget-type') as WidgetType
  if (widgetType && canAcceptChild('form', widgetType)) {
    widgetsStore.addChildWidget(props.widget.id, widgetType)
  }
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault()
  event.stopPropagation()
}

function isFormField(widget: Widget): boolean {
  return widget.type === 'form-field'
}
</script>

<template>
  <form
    class="form-widget"
    :class="{ 'form-widget--readonly': readonly }"
    :style="formStyle"
    @submit="handleSubmit"
    @dragover="!readonly && handleDragOver($event)"
    @drop="!readonly && handleDrop($event)"
  >
    <!-- Header badge - seulement en mode édition -->
    <div v-if="!readonly" class="form-header">
      <span class="form-badge"><ClipboardList :size="12" /> Formulaire</span>
    </div>

    <!-- Mode édition : draggable -->
    <draggable
      v-if="!readonly"
      v-model="children"
      item-key="id"
      group="widgets"
      ghost-class="field-ghost"
      class="form-fields"
    >
      <template #item="{ element }">
        <div class="form-child-wrapper">
          <!-- Form fields use dedicated component -->
          <FormFieldWidget
            v-if="isFormField(element)"
            :widget="element"
            :parent-id="widget.id"
            :editable="editable"
            :is-selected="selectionStore.selectedId === element.id"
            @click.stop="selectionStore.select(element.id)"
          />
          <!-- Other widgets (row, text, etc.) use generic renderer -->
          <WidgetRendererInner
            v-else
            :widget="element"
            :is-selected="selectionStore.selectedId === element.id"
            :is-hovered="selectionStore.hoveredId === element.id"
            @click.stop="selectionStore.select(element.id)"
            @mouseenter="selectionStore.setHovered(element.id)"
            @mouseleave="selectionStore.setHovered(null)"
          />
        </div>
      </template>
    </draggable>

    <!-- Mode preview : simple itération (enfants configures uniquement) -->
    <div v-else class="form-fields">
      <template v-for="element in configuredChildren" :key="element.id">
        <FormFieldWidget
          v-if="isFormField(element)"
          :widget="element"
          :parent-id="widget.id"
          :readonly="true"
        />
        <PreviewRenderer
          v-else
          :widget="element"
        />
      </template>
    </div>

    <!-- Empty state et boutons d'ajout - seulement en mode édition -->
    <div v-if="!readonly && children.length === 0" class="empty-form">
      <p>Glissez des champs ou widgets ici</p>
      <button type="button" class="add-field-btn" @click.stop="addField">
        + Ajouter un champ
      </button>
    </div>

    <div v-else-if="!readonly" class="form-actions">
      <button type="button" class="add-field-btn small" @click.stop="addField">
        + Ajouter un champ
      </button>
    </div>

    <!-- Mode édition : submit preview disabled -->
    <div v-if="!readonly" class="submit-preview">
      <button type="submit" class="submit-btn" :style="submitButtonStyle" disabled>
        {{ widget.content.submitText || 'Envoyer' }}
      </button>
      <span class="submit-hint">Aperçu du bouton</span>
    </div>

    <!-- Mode preview : vrai bouton submit actif -->
    <div v-else class="submit-section">
      <button type="submit" class="submit-btn submit-btn--active" :style="submitButtonStyle">
        {{ widget.content.submitText || 'Envoyer' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.form-widget {
  position: relative;
}

.form-header {
  margin-bottom: 12px;
}

.form-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: white;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid #e2e8f0;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-form {
  text-align: center;
  padding: 24px;
  color: var(--color-text-muted);
}

.empty-form p {
  margin: 0 0 12px 0;
  font-size: 13px;
}

.add-field-btn {
  padding: 8px 16px;
  border: 2px dashed var(--color-primary);
  background: transparent;
  color: var(--color-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.add-field-btn:hover {
  background: var(--color-primary);
  color: white;
}

.add-field-btn.small {
  padding: 6px 12px;
  font-size: 12px;
}

.form-actions {
  margin-top: 8px;
  text-align: center;
}

.submit-preview {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;
  text-align: center;
}

.submit-btn {
  padding: 12px 32px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 600;
  cursor: not-allowed;
  opacity: 0.7;
  transition: background-color 0.2s ease, border-radius 0.2s ease;
}

.submit-hint {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.submit-section {
  margin-top: 16px;
  text-align: center;
}

.submit-btn--active {
  cursor: pointer;
  opacity: 1;
}

.field-ghost {
  opacity: 0.5;
  background: rgba(20, 184, 166, 0.1);
}
</style>
