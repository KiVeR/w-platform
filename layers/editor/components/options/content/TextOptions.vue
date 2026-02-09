<script setup lang="ts">
import OptionGroup from '../shared/OptionGroup.vue'
import OptionTextareaWithVariables from '../shared/OptionTextareaWithVariables.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)
</script>

<template>
  <OptionGroup label="Texte" required>
    <OptionTextareaWithVariables
      :model-value="widget.content.text"
      placeholder="Entrez le texte"
      :rows="5"
      @update:model-value="updateContent('text', $event)"
    />
  </OptionGroup>
</template>
