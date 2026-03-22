<script setup lang="ts">
import OptionGroup from '../shared/OptionGroup.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateStyles } = useWidgetContent(props.widget)

const styleOptions = [
  { value: 'solid', label: 'Solide' },
  { value: 'dashed', label: 'Tirets' },
  { value: 'dotted', label: 'Pointillés' },
]
</script>

<template>
  <OptionGroup label="Style de ligne">
    <OptionSelect
      :model-value="widget.styles.borderStyle"
      :options="styleOptions"
      @update:model-value="updateStyles({ borderStyle: $event })"
    />
  </OptionGroup>
</template>
