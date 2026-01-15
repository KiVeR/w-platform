<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import type { Widget, WidgetType } from '@/types/widget'
import { useWidgetsStore } from '@/stores/widgets'
import { useSelectionStore } from '@/stores/selection'
import { canAcceptChild } from '@/config/widgets'
import FormFieldWidget from './FormFieldWidget.vue'
import WidgetRendererInner from '@/components/canvas/WidgetRendererInner.vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const widgetsStore = useWidgetsStore()
const selectionStore = useSelectionStore()

const children = computed({
  get: () => props.widget.children || [],
  set: (value) => {
    widgetsStore.updateWidgetChildren(props.widget.id, value)
  }
})

const formStyle = computed(() => ({
  padding: props.widget.styles.padding,
  margin: props.widget.styles.margin,
  backgroundColor: props.widget.styles.backgroundColor,
  borderRadius: props.widget.styles.borderRadius
}))

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
    :style="formStyle"
    @submit="handleSubmit"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <div class="form-header">
      <span class="form-badge">📋 Formulaire</span>
    </div>

    <draggable
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

    <div v-if="children.length === 0" class="empty-form">
      <p>Glissez des champs ou widgets ici</p>
      <button type="button" class="add-field-btn" @click.stop="addField">
        + Ajouter un champ
      </button>
    </div>

    <div v-else class="form-actions">
      <button type="button" class="add-field-btn small" @click.stop="addField">
        + Ajouter un champ
      </button>
    </div>

    <div class="submit-preview">
      <button type="submit" class="submit-btn" disabled>
        Envoyer
      </button>
      <span class="submit-hint">Aperçu du bouton</span>
    </div>
  </form>
</template>

<style scoped>
.form-widget {
  width: 100%;
  border: 2px dashed #94a3b8;
  position: relative;
}

.form-header {
  margin-bottom: 12px;
}

.form-badge {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
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
  border-radius: 6px;
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
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: not-allowed;
  opacity: 0.7;
}

.submit-hint {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.field-ghost {
  opacity: 0.5;
  background: rgba(20, 184, 166, 0.1);
}
</style>
