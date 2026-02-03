<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { computed } from 'vue'

// Phase 1 widgets - Urgence & Social Proof
import BadgeWidget from '@/components/widgets/registry/BadgeWidget.vue'
// Widget components
import BarcodeWidget from '@/components/widgets/registry/BarcodeWidget.vue'
import ButtonWidget from '@/components/widgets/registry/ButtonWidget.vue'
import ClickToCallWidget from '@/components/widgets/registry/ClickToCallWidget.vue'
import CountdownWidget from '@/components/widgets/registry/CountdownWidget.vue'
import DriveWidget from '@/components/widgets/registry/DriveWidget.vue'
import EffectWidget from '@/components/widgets/registry/EffectWidget.vue'
import FlipcardWidget from '@/components/widgets/registry/FlipcardWidget.vue'
import FormWidget from '@/components/widgets/registry/FormWidget.vue'
import GalleryWidget from '@/components/widgets/registry/GalleryWidget.vue'
import IconWidget from '@/components/widgets/registry/IconWidget.vue'
import ImageWidget from '@/components/widgets/registry/ImageWidget.vue'
import LinkImageWidget from '@/components/widgets/registry/LinkImageWidget.vue'
import MapWidget from '@/components/widgets/registry/MapWidget.vue'
import RowWidget from '@/components/widgets/registry/RowWidget.vue'
import ScratchWidget from '@/components/widgets/registry/ScratchWidget.vue'
import SeparatorWidget from '@/components/widgets/registry/SeparatorWidget.vue'
import SliderWidget from '@/components/widgets/registry/SliderWidget.vue'
import SocialWidget from '@/components/widgets/registry/SocialWidget.vue'
import SpacerWidget from '@/components/widgets/registry/SpacerWidget.vue'
import StoreLocatorWidget from '@/components/widgets/registry/StoreLocatorWidget.vue'
import TestimonialWidget from '@/components/widgets/registry/TestimonialWidget.vue'
import TextWidget from '@/components/widgets/registry/TextWidget.vue'
import TitleWidget from '@/components/widgets/registry/TitleWidget.vue'
import VideoWidget from '@/components/widgets/registry/VideoWidget.vue'

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
