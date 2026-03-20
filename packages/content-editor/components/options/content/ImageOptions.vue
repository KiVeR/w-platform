<script setup lang="ts">
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInputWithVariables from '../shared/OptionInputWithVariables.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="URL de l'image" required>
      <OptionInputWithVariables
        :model-value="widget.content.src"
        type="url"
        placeholder="https://exemple.com/image.jpg"
        @update:model-value="updateContent('src', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Texte alternatif">
      <OptionInputWithVariables
        :model-value="widget.content.alt"
        placeholder="Description de l'image"
        @update:model-value="updateContent('alt', $event)"
      />
    </OptionGroup>
  </div>
</template>

<style scoped>
.options-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
