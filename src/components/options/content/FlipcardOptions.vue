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
    <OptionGroup label="Image recto (avant)" required>
      <OptionInput
        :model-value="widget.content.flipcardImageFront"
        type="url"
        placeholder="https://..."
        @update:model-value="updateContent('flipcardImageFront', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Image verso (après)" required>
      <OptionInput
        :model-value="widget.content.flipcardImageBack"
        type="url"
        placeholder="https://..."
        @update:model-value="updateContent('flipcardImageBack', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Lien de destination">
      <OptionInput
        :model-value="widget.content.flipcardLink"
        type="url"
        placeholder="https://..."
        @update:model-value="updateContent('flipcardLink', $event)"
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
