<script setup lang="ts">
import type { Component } from 'vue'
import type { Widget, WidgetType } from '@/types/widget'
import TitleWidget from '@/components/widgets/registry/TitleWidget.vue'
import TextWidget from '@/components/widgets/registry/TextWidget.vue'
import ImageWidget from '@/components/widgets/registry/ImageWidget.vue'
import ButtonWidget from '@/components/widgets/registry/ButtonWidget.vue'
import SeparatorWidget from '@/components/widgets/registry/SeparatorWidget.vue'
import SpacerWidget from '@/components/widgets/registry/SpacerWidget.vue'
import ClickToCallWidget from '@/components/widgets/registry/ClickToCallWidget.vue'
import RowWidget from '@/components/widgets/registry/RowWidget.vue'
import FormWidget from '@/components/widgets/registry/FormWidget.vue'
import FormFieldWidget from '@/components/widgets/registry/FormFieldWidget.vue'
// Media widgets
import VideoWidget from '@/components/widgets/registry/VideoWidget.vue'
import MapWidget from '@/components/widgets/registry/MapWidget.vue'
import SocialWidget from '@/components/widgets/registry/SocialWidget.vue'
import IconWidget from '@/components/widgets/registry/IconWidget.vue'
// Wellpack widgets
import BarcodeWidget from '@/components/widgets/registry/BarcodeWidget.vue'
import StoreLocatorWidget from '@/components/widgets/registry/StoreLocatorWidget.vue'
import DriveWidget from '@/components/widgets/registry/DriveWidget.vue'
import ScratchWidget from '@/components/widgets/registry/ScratchWidget.vue'
import FlipcardWidget from '@/components/widgets/registry/FlipcardWidget.vue'
// Advanced widgets
import GalleryWidget from '@/components/widgets/registry/GalleryWidget.vue'
import SliderWidget from '@/components/widgets/registry/SliderWidget.vue'
import LinkImageWidget from '@/components/widgets/registry/LinkImageWidget.vue'
import EffectWidget from '@/components/widgets/registry/EffectWidget.vue'

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
  title: TitleWidget,
  text: TextWidget,
  image: ImageWidget,
  button: ButtonWidget,
  separator: SeparatorWidget,
  spacer: SpacerWidget,
  'click-to-call': ClickToCallWidget,
  row: RowWidget,
  form: FormWidget,
  'form-field': FormFieldWidget,
  // Media
  video: VideoWidget,
  map: MapWidget,
  social: SocialWidget,
  icon: IconWidget,
  // Wellpack
  barcode: BarcodeWidget,
  'store-locator': StoreLocatorWidget,
  drive: DriveWidget,
  scratch: ScratchWidget,
  flipcard: FlipcardWidget,
  // Advanced
  gallery: GalleryWidget,
  slider: SliderWidget,
  'link-image': LinkImageWidget,
  effect: EffectWidget
}
</script>

<template>
  <div
    class="widget-inner"
    :class="{
      'is-selected': isSelected,
      'is-hovered': isHovered && !isSelected
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
