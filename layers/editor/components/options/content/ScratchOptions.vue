<script setup lang="ts">
import type { Widget } from '../../types/widget'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import OptionSlider from '../shared/OptionSlider.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Image du dessus (à gratter)" required>
      <OptionInput
        :model-value="widget.content.scratchImageFg"
        type="url"
        placeholder="https://..."
        @update:model-value="updateContent('scratchImageFg', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Image du dessous (révélée)" required>
      <OptionInput
        :model-value="widget.content.scratchImageBg"
        type="url"
        placeholder="https://..."
        @update:model-value="updateContent('scratchImageBg', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Taille de la pièce">
      <OptionSlider
        :model-value="widget.content.scratchSize || 30"
        :min="10"
        :max="100"
        unit="px"
        @update:model-value="updateContent('scratchSize', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Pourcentage à gratter">
      <OptionSlider
        :model-value="widget.content.scratchPercent || 80"
        :min="30"
        :max="100"
        unit="%"
        @update:model-value="updateContent('scratchPercent', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Lien de destination">
      <OptionInput
        :model-value="widget.content.scratchLink"
        type="url"
        placeholder="https://..."
        @update:model-value="updateContent('scratchLink', $event)"
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
