<script setup lang="ts">
import type { Component } from 'vue'
import {
  BadgeWidget,
  BarcodeWidget,
  ButtonWidget,
  ClickToCallWidget,
  CountdownWidget,
  DriveWidget,
  EffectWidget,
  FlipcardWidget,
  FormFieldWidget,
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
import { GripVertical, Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  widget: Widget
  isSelected: boolean
  isHovered: boolean
}>()

const emit = defineEmits<{
  click: []
  mouseenter: []
  mouseleave: []
}>()

const widgetsStore = useWidgetsStore()
const selectionStore = useSelectionStore()

function handleDelete() {
  widgetsStore.removeWidgetAnywhere(props.widget.id)
  selectionStore.deselect()
}

const widgetComponents: Partial<Record<WidgetType, Component>> = {
  'title': TitleWidget,
  'text': TextWidget,
  'image': ImageWidget,
  'button': ButtonWidget,
  'separator': SeparatorWidget,
  'spacer': SpacerWidget,
  'click-to-call': ClickToCallWidget,
  'row': RowWidget,
  'form': FormWidget,
  'form-field': FormFieldWidget,
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
</script>

<template>
  <div
    class="widget-inner"
    :class="{
      'is-selected': isSelected,
      'is-hovered': isHovered && !isSelected,
    }"
    @click.stop="emit('click')"
    @mouseenter="emit('mouseenter')"
    @mouseleave="emit('mouseleave')"
  >
    <!-- Mini toolbar for inner widgets -->
    <Transition name="toolbar-fade">
      <div v-if="isSelected" class="inner-toolbar">
        <button
          class="inner-toolbar-action inner-widget-handle"
          title="Déplacer"
          aria-label="Déplacer le widget"
        >
          <GripVertical :size="12" />
        </button>
        <button
          class="inner-toolbar-action danger"
          title="Supprimer (Delete)"
          aria-label="Supprimer le widget"
          @click.stop="handleDelete"
        >
          <Trash2 :size="12" />
        </button>
      </div>
    </Transition>

    <component
      :is="widgetComponents[widget.type]"
      :widget="widget"
      :editable="isSelected"
    />
  </div>
</template>

<style scoped>
.widget-inner {
  position: relative;
  transition: all 0.2s;
}

.widget-inner.is-hovered {
  outline: 1px dashed var(--color-primary);
  outline-offset: 1px;
}

.widget-inner.is-selected {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

/* Inner toolbar */
.inner-toolbar {
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 100;
}

.inner-toolbar-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.inner-toolbar-action:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.inner-toolbar-action.inner-widget-handle {
  cursor: grab;
}

.inner-toolbar-action.inner-widget-handle:active {
  cursor: grabbing;
}

.inner-toolbar-action.danger:hover {
  background: var(--color-error-100);
  color: var(--color-error-500);
}

/* Toolbar animation */
.toolbar-fade-enter-active,
.toolbar-fade-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.toolbar-fade-enter-from,
.toolbar-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
