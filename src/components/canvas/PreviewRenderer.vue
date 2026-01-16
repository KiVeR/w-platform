<script setup lang="ts">
import type { Widget } from '@/types/widget'

// Widget components
import BarcodeWidget from '@/components/widgets/registry/BarcodeWidget.vue'
import ButtonWidget from '@/components/widgets/registry/ButtonWidget.vue'
import ClickToCallWidget from '@/components/widgets/registry/ClickToCallWidget.vue'
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
import TextWidget from '@/components/widgets/registry/TextWidget.vue'
import TitleWidget from '@/components/widgets/registry/TitleWidget.vue'
import VideoWidget from '@/components/widgets/registry/VideoWidget.vue'

defineProps<{
  widget: Widget
}>()

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
}
</script>

<template>
  <component
    :is="widgetComponents[widget.type]"
    :widget="widget"
    :editable="false"
    :readonly="true"
  />
</template>
