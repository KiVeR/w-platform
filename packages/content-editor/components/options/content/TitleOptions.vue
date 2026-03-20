<script setup lang="ts">
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInputWithVariables from '../shared/OptionInputWithVariables.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)
</script>

<template>
  <OptionGroup label="Texte" required>
    <OptionInputWithVariables
      :model-value="widget.content.text"
      placeholder="Entrez le titre"
      @update:model-value="updateContent('text', $event)"
    />
  </OptionGroup>
</template>
