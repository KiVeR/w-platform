<script setup lang="ts">
import type { Widget } from '@/types/widget'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionTextarea from '../shared/OptionTextarea.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)
</script>

<template>
  <OptionGroup label="Texte" required>
    <OptionTextarea
      :model-value="widget.content.text"
      placeholder="Entrez le texte"
      :rows="5"
      @update:model-value="updateContent('text', $event)"
    />
  </OptionGroup>
</template>
