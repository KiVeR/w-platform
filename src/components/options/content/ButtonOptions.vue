<script setup lang="ts">
import type { Widget } from '@/types/widget'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

const actionOptions = [
  { value: 'link', label: 'Lien' },
  { value: 'tel', label: 'Téléphone' },
  { value: 'email', label: 'Email' },
]
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Texte du bouton" required>
      <OptionInput
        :model-value="widget.content.text"
        placeholder="Cliquez ici"
        @update:model-value="updateContent('text', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Action">
      <OptionSelect
        :model-value="widget.content.action"
        :options="actionOptions"
        @update:model-value="updateContent('action', $event as 'link' | 'tel' | 'email')"
      />
    </OptionGroup>

    <OptionGroup v-if="widget.content.action === 'tel'" label="Numéro de téléphone" required>
      <OptionInput
        :model-value="widget.content.phone"
        type="tel"
        placeholder="+33123456789"
        @update:model-value="updateContent('phone', $event)"
      />
    </OptionGroup>

    <OptionGroup v-else :label="widget.content.action === 'email' ? 'Email' : 'URL'" required>
      <OptionInput
        :model-value="widget.content.href"
        :type="widget.content.action === 'email' ? 'email' : 'url'"
        :placeholder="widget.content.action === 'email' ? 'contact@exemple.com' : 'https://exemple.com'"
        @update:model-value="updateContent('href', $event)"
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
