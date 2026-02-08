<script setup lang="ts">
import type { Widget } from '../types/widget'
import {
  BadgeWidget,
  BarcodeWidget,
  ButtonWidget,
  ClickToCallWidget,
  CountdownWidget,
  DriveWidget,
  EffectWidget,
  FlipcardWidget,
  FormWidget,
  GalleryWidget,
  IconWidget,
  ImageWidget,
  LinkImageWidget,
  MapWidget,
  RowWidget,
  ScratchWidget,
  SeparatorWidget,
  SliderWidget,
  SocialWidget,
  SpacerWidget,
  StoreLocatorWidget,
  TestimonialWidget,
  TextWidget,
  TitleWidget,
  VideoWidget,
} from '#components'
import { ChevronDown, ChevronUp, Copy, GripVertical, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  widget: Widget
  isSelected: boolean
  isHovered: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'mouseenter'): void
  (e: 'mouseleave'): void
}>()

const widgetsStore = useWidgetsStore()
const selectionStore = useSelectionStore()

const widgetComponents: Record<string, any> = {
  'title': TitleWidget,
  'text': TextWidget,
  'image': ImageWidget,
  'button': ButtonWidget,
  'separator': SeparatorWidget,
  'spacer': SpacerWidget,
  'click-to-call': ClickToCallWidget,
  'row': RowWidget,
  'form': FormWidget,
  // Media
  'video': VideoWidget,
  'map': MapWidget,
  'social': SocialWidget,
  'icon': IconWidget,
  // Wellpack
  'barcode': BarcodeWidget,
  'store-locator': StoreLocatorWidget,
  'drive': DriveWidget,
  'scratch': ScratchWidget,
  'flipcard': FlipcardWidget,
  // Advanced
  'gallery': GalleryWidget,
  'slider': SliderWidget,
  'link-image': LinkImageWidget,
  'effect': EffectWidget,
  // Phase 1 - Urgence & Social Proof
  'countdown': CountdownWidget,
  'testimonial': TestimonialWidget,
  'badge': BadgeWidget,
}

// Les widgets containers n'affichent pas les actions latérales de la même façon
const isContainer = ['row', 'form'].includes(props.widget.type)

// Computed pour savoir si le widget est en première ou dernière position
const isFirst = computed(() => {
  const items = widgetsStore.sortedItems
  const index = items.findIndex(w => w.id === props.widget.id)
  return index === 0
})

const isLast = computed(() => {
  const items = widgetsStore.sortedItems
  const index = items.findIndex(w => w.id === props.widget.id)
  return index === items.length - 1
})

function handleDelete() {
  widgetsStore.removeWidget(props.widget.id)
  selectionStore.deselect()
}

function handleDuplicate() {
  const newWidget = widgetsStore.duplicateWidget(props.widget.id)
  if (newWidget) {
    selectionStore.select(newWidget.id)
  }
}

function handleMoveUp() {
  const items = widgetsStore.sortedItems
  const index = items.findIndex(w => w.id === props.widget.id)
  if (index > 0) {
    widgetsStore.moveWidget(index, index - 1)
  }
}

function handleMoveDown() {
  const items = widgetsStore.sortedItems
  const index = items.findIndex(w => w.id === props.widget.id)
  if (index < items.length - 1) {
    widgetsStore.moveWidget(index, index + 1)
  }
}
</script>

<template>
  <div
    class="widget-wrapper"
    :class="{
      'is-selected': isSelected,
      'is-hovered': isHovered && !isSelected,
      'is-container': isContainer,
    }"
    @click.stop="emit('click')"
    @mouseenter="emit('mouseenter')"
    @mouseleave="emit('mouseleave')"
  >
    <!-- Floating Toolbar -->
    <Transition name="toolbar-fade">
      <div v-if="isSelected" class="widget-toolbar" role="toolbar" aria-label="Actions du widget">
        <button
          class="toolbar-action widget-handle"
          title="Déplacer"
          aria-label="Déplacer le widget"
        >
          <GripVertical :size="14" />
        </button>
        <button
          class="toolbar-action"
          :disabled="isFirst"
          title="Monter (Alt+↑)"
          aria-label="Monter le widget"
          @click.stop="handleMoveUp"
        >
          <ChevronUp :size="14" />
        </button>
        <button
          class="toolbar-action"
          :disabled="isLast"
          title="Descendre (Alt+↓)"
          aria-label="Descendre le widget"
          @click.stop="handleMoveDown"
        >
          <ChevronDown :size="14" />
        </button>
        <div class="toolbar-divider" />
        <button
          class="toolbar-action"
          title="Dupliquer (Ctrl+D)"
          aria-label="Dupliquer le widget"
          @click.stop="handleDuplicate"
        >
          <Copy :size="14" />
        </button>
        <button
          class="toolbar-action danger"
          title="Supprimer (Delete)"
          aria-label="Supprimer le widget"
          @click.stop="handleDelete"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </Transition>

    <!-- Widget Content -->
    <component
      :is="widgetComponents[widget.type]"
      :widget="widget"
      :editable="isSelected"
    />
  </div>
</template>

<style scoped>
.widget-wrapper {
  position: relative;
  transition: all 0.2s;
}

.widget-wrapper.is-hovered {
  outline: 2px dashed var(--color-primary);
  outline-offset: 2px;
}

.widget-wrapper.is-selected {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.widget-wrapper.is-container.is-selected {
  outline-offset: 4px;
}

/* Floating Toolbar */
.widget-toolbar {
  position: absolute;
  top: -44px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 100;
}

.toolbar-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toolbar-action:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.toolbar-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-action.widget-handle {
  cursor: grab;
}

.toolbar-action.widget-handle:active {
  cursor: grabbing;
}

.toolbar-action.danger:hover:not(:disabled) {
  background: var(--color-error-100);
  color: var(--color-error-500);
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 var(--space-1);
}

/* Toolbar animation */
.toolbar-fade-enter-active,
.toolbar-fade-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.toolbar-fade-enter-from,
.toolbar-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
