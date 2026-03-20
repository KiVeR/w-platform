<script setup lang="ts">
import OptionCheckbox from '../shared/OptionCheckbox.vue'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

const gapOptions = [
  { value: '8px', label: 'Petit (8px)' },
  { value: '16px', label: 'Moyen (16px)' },
  { value: '24px', label: 'Grand (24px)' },
  { value: '32px', label: 'Très grand (32px)' },
]

const alignOptions = [
  { value: 'stretch', label: 'Étirer' },
  { value: 'start', label: 'Haut' },
  { value: 'center', label: 'Centre' },
  { value: 'end', label: 'Bas' },
]
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Espacement (gap)">
      <OptionSelect
        :model-value="widget.content.gap"
        :options="gapOptions"
        @update:model-value="updateContent('gap', $event as WidgetContent['gap'])"
      />
    </OptionGroup>

    <OptionGroup label="Alignement vertical">
      <OptionSelect
        :model-value="widget.content.align"
        :options="alignOptions"
        @update:model-value="updateContent('align', $event as 'start' | 'center' | 'end' | 'stretch')"
      />
    </OptionGroup>

    <OptionCheckbox
      :model-value="widget.content.wrap !== false"
      label="Retour à la ligne sur mobile"
      @update:model-value="updateContent('wrap', $event)"
    />
  </div>
</template>

<style scoped>
.options-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
