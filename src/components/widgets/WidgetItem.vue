<script setup lang="ts">
import type { WidgetConfig } from '@/types/widget'
import {
  AlignLeft,
  Badge,
  Barcode,
  Car,
  ClipboardList,
  Columns,
  FlipHorizontal,
  Heading,
  Image,
  Images,
  Link2,
  MapPin,
  MessageSquareQuote,
  Minus,
  MousePointer,
  MoveVertical,
  Phone,
  Play,
  Share2,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Square,
  Star,
  Store,
  TextCursorInput,
  Timer,
} from 'lucide-vue-next'
import { ref } from 'vue'
import { useWidgetsStore } from '@/stores/widgets'

const props = withDefaults(defineProps<{
  config: WidgetConfig
  compact?: boolean
}>(), {
  compact: false,
})

const widgetsStore = useWidgetsStore()
const isDragging = ref(false)

// Mapping des types de widgets vers les icônes Lucide
const iconMap: Record<string, any> = {
  'title': Heading,
  'text': AlignLeft,
  'image': Image,
  'button': MousePointer,
  'separator': Minus,
  'spacer': MoveVertical,
  'click-to-call': Phone,
  'row': Columns,
  'column': Square,
  'form': ClipboardList,
  'form-field': TextCursorInput,
  'video': Play,
  'map': MapPin,
  'social': Share2,
  'icon': Star,
  'barcode': Barcode,
  'store-locator': Store,
  'drive': Car,
  'scratch': Sparkles,
  'flipcard': FlipHorizontal,
  'gallery': Images,
  'slider': SlidersHorizontal,
  'link-image': Link2,
  'effect': Snowflake,
  // Phase 1 - Urgence & Social Proof
  'countdown': Timer,
  'testimonial': MessageSquareQuote,
  'badge': Badge,
}

function handleDragStart(event: DragEvent) {
  isDragging.value = true
  if (event.dataTransfer) {
    event.dataTransfer.setData('widget-type', props.config.type)
    event.dataTransfer.effectAllowed = 'copy'
  }
  widgetsStore.setDraggedWidgetType(props.config.type)
}

function handleDragEnd() {
  isDragging.value = false
  widgetsStore.setDraggedWidgetType(null)
}

function handleClick() {
  widgetsStore.addWidget(props.config.type)
}
</script>

<template>
  <div
    class="widget-item"
    :class="{ dragging: isDragging, compact }"
    draggable="true"
    role="button"
    tabindex="0"
    :title="config.description"
    :aria-label="`Ajouter widget ${config.label}`"
    :aria-describedby="config.description ? `${config.type}-tooltip` : undefined"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <div class="widget-icon">
      <component :is="iconMap[config.type]" :size="20" />
    </div>
    <div class="widget-label">
      {{ config.label }}
    </div>
    <span v-if="config.description" :id="`${config.type}-tooltip`" class="sr-only">
      {{ config.description }}
    </span>
  </div>
</template>

<style scoped>
.widget-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-2);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  cursor: grab;
  transition: all var(--transition-fast);
  user-select: none;
}

.widget-item:hover {
  border-color: var(--color-primary-400);
  background-color: var(--color-primary-50);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.widget-item:hover .widget-icon {
  color: var(--color-primary-600);
}

.widget-item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.widget-item:active,
.widget-item.dragging {
  cursor: grabbing;
  transform: scale(0.95);
  opacity: 0.8;
}

.widget-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-bottom: var(--space-1);
  color: var(--color-text-secondary);
  transition: color var(--transition-fast);
}

.widget-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  text-align: center;
  max-width: 100%;

  /* Support sur 2 lignes */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.2;
}

/* Compact mode for suggestions */
.widget-item.compact {
  padding: var(--space-1);
  aspect-ratio: auto;
  min-width: 56px;
}

.widget-item.compact .widget-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
}

.widget-item.compact .widget-icon svg {
  width: 16px;
  height: 16px;
}

.widget-item.compact .widget-label {
  font-size: 10px;
  -webkit-line-clamp: 1;
}

/* Screen reader only - for accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
