<script setup lang="ts">
import type { Widget } from '@/types/widget'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)
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
</style>
