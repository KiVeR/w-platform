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
import { computed } from 'vue'

const props = defineProps<{
  widget: Widget
}>()

/**
 * Check if a widget has meaningful content to display
 * Empty widgets are hidden in preview mode
 */
function isWidgetEmpty(widget: Widget): boolean {
  const { type } = widget
  const content = widget.content as Record<string, any>

  switch (type) {
    // Text content widgets
    case 'title':
    case 'text':
    case 'badge':
      return !content.text?.trim()

    // Media widgets
    case 'image':
    case 'link-image':
      return !content.src
    case 'video':
      return !content.videoUrl
    case 'gallery':
    case 'slider':
      return !content.images?.length

    // Location widgets
    case 'map':
      return !content.address && !content.lat && !content.lng
    case 'store-locator':
      return !content.stores?.length

    // Social/links widgets
    case 'social':
      return !content.links?.length

    // Interactive widgets
    case 'countdown':
      return !content.targetDate
    case 'testimonial':
      return !content.quote && !content.author
    case 'barcode':
      return !content.value
    case 'flipcard':
      return !content.frontImage && !content.backImage && !content.frontText && !content.backText
    case 'scratch':
      return !content.revealImage

    // Icon
    case 'icon':
      return !content.icon

    // These widgets always have content or are structural
    case 'button':
    case 'click-to-call':
    case 'row':
    case 'form':
    case 'spacer':
    case 'separator':
    case 'effect':
    case 'drive':
      return false

    default:
      return false
  }
}

const isEmpty = computed(() => isWidgetEmpty(props.widget))

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
  'video': VideoWidget,
  'map': MapWidget,
  'social': SocialWidget,
  'icon': IconWidget,
  'barcode': BarcodeWidget,
  'store-locator': StoreLocatorWidget,
  'drive': DriveWidget,
  'scratch': ScratchWidget,
  'flipcard': FlipcardWidget,
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
  <component
    :is="widgetComponents[widget.type]"
    v-if="!isEmpty"
    :widget="widget"
    :editable="false"
    :readonly="true"
  />
</template>
