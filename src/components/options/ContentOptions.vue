<script setup lang="ts">
import type { Component } from 'vue'
import type { Widget, WidgetType } from '@/types/widget'
import { computed, defineAsyncComponent } from 'vue'

const props = defineProps<{
  widget: Widget
}>()

// Registry des composants d'options par type de widget
const optionComponents: Partial<Record<WidgetType, Component>> = {
  'title': defineAsyncComponent(() => import('./content/TitleOptions.vue')),
  'text': defineAsyncComponent(() => import('./content/TextOptions.vue')),
  'image': defineAsyncComponent(() => import('./content/ImageOptions.vue')),
  'button': defineAsyncComponent(() => import('./content/ButtonOptions.vue')),
  'click-to-call': defineAsyncComponent(() => import('./content/ClickToCallOptions.vue')),
  'spacer': defineAsyncComponent(() => import('./content/SpacerOptions.vue')),
  'separator': defineAsyncComponent(() => import('./content/SeparatorOptions.vue')),
  'row': defineAsyncComponent(() => import('./content/RowOptions.vue')),
  'column': defineAsyncComponent(() => import('./content/ColumnOptions.vue')),
  'form': defineAsyncComponent(() => import('./content/FormOptions.vue')),
  'form-field': defineAsyncComponent(() => import('./content/FormFieldOptions.vue')),
  'video': defineAsyncComponent(() => import('./content/VideoOptions.vue')),
  'map': defineAsyncComponent(() => import('./content/MapOptions.vue')),
  'social': defineAsyncComponent(() => import('./content/SocialOptions.vue')),
  'icon': defineAsyncComponent(() => import('./content/IconOptions.vue')),
  'barcode': defineAsyncComponent(() => import('./content/BarcodeOptions.vue')),
  'store-locator': defineAsyncComponent(() => import('./content/StoreLocatorOptions.vue')),
  'drive': defineAsyncComponent(() => import('./content/DriveOptions.vue')),
  'scratch': defineAsyncComponent(() => import('./content/ScratchOptions.vue')),
  'flipcard': defineAsyncComponent(() => import('./content/FlipcardOptions.vue')),
  'gallery': defineAsyncComponent(() => import('./content/GalleryOptions.vue')),
  'slider': defineAsyncComponent(() => import('./content/SliderOptions.vue')),
  'link-image': defineAsyncComponent(() => import('./content/LinkImageOptions.vue')),
  'effect': defineAsyncComponent(() => import('./content/EffectOptions.vue')),
}

const currentComponent = computed(() => {
  return optionComponents[props.widget.type] || null
})
</script>

<template>
  <div class="content-options">
    <component
      :is="currentComponent"
      v-if="currentComponent"
      :widget="widget"
    />
    <p v-else class="no-options">
      Aucune option de contenu disponible pour ce widget.
    </p>

    <p class="required-hint">
      * champs obligatoires
    </p>
  </div>
</template>

<style scoped>
.content-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.no-options {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-style: italic;
  text-align: center;
  padding: var(--space-4);
}

.required-hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-2);
}
</style>
