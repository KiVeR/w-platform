<script setup lang="ts">
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import OptionSlider from '../shared/OptionSlider.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

const styleOptions = [
  { value: 'roadmap', label: 'Plan' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'hybrid', label: 'Hybride' },
  { value: 'terrain', label: 'Terrain' },
]
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Adresse" required>
      <OptionInput
        :model-value="widget.content.address"
        placeholder="123 rue Example, Paris"
        @update:model-value="updateContent('address', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Zoom (1-20)">
      <OptionSlider
        :model-value="widget.content.zoom || 15"
        :min="1"
        :max="20"
        @update:model-value="updateContent('zoom', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Style de carte">
      <OptionSelect
        :model-value="widget.content.mapStyle"
        :options="styleOptions"
        @update:model-value="updateContent('mapStyle', $event as 'roadmap' | 'satellite' | 'hybrid' | 'terrain')"
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
