<script setup lang="ts">
import type { Widget } from '@/types/widget'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionSlider from '../shared/OptionSlider.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateStyles } = useWidgetContent(props.widget)
</script>

<template>
  <OptionGroup label="Hauteur">
    <OptionSlider
      :model-value="parseInt(widget.styles.height || '32')"
      :min="8"
      :max="200"
      unit="px"
      @update:model-value="updateStyles({ height: `${$event}px` })"
    />
  </OptionGroup>
</template>
