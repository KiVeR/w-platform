<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { useWidgetsStore } from '@/stores/widgets'
import { useSelectionStore } from '@/stores/selection'

// Widget components
import TitleWidget from '@/components/widgets/registry/TitleWidget.vue'
import TextWidget from '@/components/widgets/registry/TextWidget.vue'
import ImageWidget from '@/components/widgets/registry/ImageWidget.vue'
import ButtonWidget from '@/components/widgets/registry/ButtonWidget.vue'
import SeparatorWidget from '@/components/widgets/registry/SeparatorWidget.vue'
import SpacerWidget from '@/components/widgets/registry/SpacerWidget.vue'
import ClickToCallWidget from '@/components/widgets/registry/ClickToCallWidget.vue'
import RowWidget from '@/components/widgets/registry/RowWidget.vue'
import FormWidget from '@/components/widgets/registry/FormWidget.vue'
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
  title: TitleWidget,
  text: TextWidget,
  image: ImageWidget,
  button: ButtonWidget,
  separator: SeparatorWidget,
  spacer: SpacerWidget,
  'click-to-call': ClickToCallWidget,
  row: RowWidget,
  form: FormWidget,
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

// Les widgets containers n'affichent pas les actions latérales de la même façon
const isContainer = ['row', 'form'].includes(props.widget.type)

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
      'is-container': isContainer
    }"
    @click.stop="emit('click')"
    @mouseenter="emit('mouseenter')"
    @mouseleave="emit('mouseleave')"
  >
    <!-- Widget Actions -->
    <div v-if="isSelected" class="widget-actions">
      <button class="action-btn widget-handle" title="Déplacer">
        ⋮⋮
      </button>
      <button class="action-btn" @click.stop="handleMoveUp" title="Monter">
        ↑
      </button>
      <button class="action-btn" @click.stop="handleMoveDown" title="Descendre">
        ↓
      </button>
      <button class="action-btn" @click.stop="handleDuplicate" title="Dupliquer">
        ⧉
      </button>
      <button class="action-btn delete" @click.stop="handleDelete" title="Supprimer">
        🗑
      </button>
    </div>

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

.widget-actions {
  position: absolute;
  top: 50%;
  left: -40px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: var(--color-background);
  border-color: var(--color-primary);
}

.action-btn.widget-handle {
  cursor: grab;
}

.action-btn.widget-handle:active {
  cursor: grabbing;
}

.action-btn.delete:hover {
  background-color: #fee2e2;
  border-color: #ef4444;
  color: #ef4444;
}
</style>
