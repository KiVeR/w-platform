<script setup lang="ts">
import type { Widget } from '../../types/widget'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionIconSelect from '../shared/OptionIconSelect.vue'
import OptionInput from '../shared/OptionInput.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

const iconPositionOptions = [
  { value: 'start', label: 'Avant le texte' },
  { value: 'end', label: 'Après le texte' },
]
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Texte" required>
      <OptionInput
        :model-value="widget.content.text"
        placeholder="Appeler"
        @update:model-value="updateContent('text', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Icône">
      <OptionIconSelect
        :model-value="widget.content.icon"
        placeholder="Phone (par défaut)"
        @update:model-value="updateContent('icon', $event)"
      />
      <OptionSelect
        v-if="widget.content.icon"
        :model-value="widget.content.iconPosition || 'start'"
        :options="iconPositionOptions"
        class="icon-position-select"
        @update:model-value="updateContent('iconPosition', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Téléphone" required>
      <OptionInput
        :model-value="widget.content.phone"
        type="tel"
        placeholder="+33123456789"
        @update:model-value="updateContent('phone', $event)"
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

.icon-position-select {
  margin-top: 8px;
}
</style>
