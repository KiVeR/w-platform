<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { computed } from 'vue'
import draggable from 'vuedraggable'
import { useSelectionStore } from '@/stores/selection'
import { useWidgetsStore } from '@/stores/widgets'
import { hasConfiguredChildren } from '@/utils/widgetConfig'
import ColumnWidget from './ColumnWidget.vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
  readonly?: boolean
}>()

const widgetsStore = useWidgetsStore()
const selectionStore = useSelectionStore()

const children = computed({
  get: () => props.widget.children || [],
  set: (value) => {
    widgetsStore.updateWidgetChildren(props.widget.id, value)
  },
})

const rowStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  gap: props.widget.content.gap || '16px',
  flexWrap: props.widget.content.wrap !== false ? 'wrap' as const : 'nowrap' as const,
  alignItems: props.widget.content.align || 'stretch',
  padding: props.widget.styles.padding,
  margin: props.widget.styles.margin,
  minHeight: props.readonly ? 'auto' : '60px',
}))

// En mode preview, filtrer les colonnes vides (sans enfants configures)
const columnsWithContent = computed(() =>
  children.value.filter(hasConfiguredChildren),
)

function addColumn() {
  widgetsStore.addChildWidget(props.widget.id, 'column')
}
</script>

<template>
  <div class="row-widget" :class="{ 'row-widget--readonly': readonly }" :style="rowStyle">
    <!-- Mode édition : draggable -->
    <draggable
      v-if="!readonly"
      v-model="children"
      item-key="id"
      group="columns"
      ghost-class="column-ghost"
      class="row-content"
      :style="{ display: 'contents' }"
    >
      <template #item="{ element }">
        <ColumnWidget
          :widget="element"
          :editable="editable"
          :is-selected="selectionStore.selectedId === element.id"
          @click.stop="selectionStore.select(element.id)"
        />
      </template>
    </draggable>

    <!-- Mode preview : simple itération (colonnes avec contenu uniquement) -->
    <template v-else>
      <ColumnWidget
        v-for="element in columnsWithContent"
        :key="element.id"
        :widget="element"
        :readonly="true"
      />
    </template>

    <button
      v-if="!readonly && editable && children.length < 4"
      class="add-column-btn"
      title="Ajouter une colonne"
      @click.stop="addColumn"
    >
      <span>+</span>
    </button>

    <div v-if="!readonly && children.length === 0" class="empty-row">
      <p>Cliquez sur + pour ajouter des colonnes</p>
    </div>
  </div>
</template>

<style scoped>
.row-widget {
  width: 100%;
  position: relative;
  background: rgba(20, 184, 166, 0.05);
  border: 1px dashed rgba(20, 184, 166, 0.3);
  border-radius: 4px;
}

.row-widget--readonly {
  background: transparent;
  border: none;
}

.row-content {
  display: contents;
}

.add-column-btn {
  width: 32px;
  height: 32px;
  border: 2px dashed var(--color-primary);
  background: transparent;
  border-radius: 4px;
  color: var(--color-primary);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  align-self: center;
}

.add-column-btn:hover {
  background: var(--color-primary);
  color: white;
}

.empty-row {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 12px;
  padding: 16px;
}

.column-ghost {
  opacity: 0.5;
  background: rgba(20, 184, 166, 0.2);
}
</style>
