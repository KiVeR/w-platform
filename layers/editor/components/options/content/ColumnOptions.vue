<script setup lang="ts">
import OptionGroup from '../shared/OptionGroup.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

const widthOptions = [
  { value: 'auto', label: 'Auto (flexible)' },
  { value: '25%', label: '25%' },
  { value: '33%', label: '33%' },
  { value: '50%', label: '50%' },
  { value: '66%', label: '66%' },
  { value: '75%', label: '75%' },
  { value: '100%', label: '100%' },
]
</script>

<template>
  <OptionGroup label="Largeur">
    <OptionSelect
      :model-value="widget.content.columnWidth"
      :options="widthOptions"
      @update:model-value="updateContent('columnWidth', $event)"
    />
  </OptionGroup>
</template>
