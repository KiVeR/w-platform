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

defineProps<{
  widget: Widget
  isSelected: boolean
  isHovered: boolean
}>()

const emit = defineEmits<{
  click: []
  mouseenter: []
  mouseleave: []
}>()

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
</style>
