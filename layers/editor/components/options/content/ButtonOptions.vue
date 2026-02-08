<script setup lang="ts">
import type { Widget } from '../../types/widget'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionIconSelect from '../shared/OptionIconSelect.vue'
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

const iconPositionOptions = [
  { value: 'start', label: 'Avant le texte' },
  { value: 'end', label: 'Après le texte' },
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

    <OptionGroup label="Icône (optionnel)">
      <OptionIconSelect
        :model-value="widget.content.icon"
        placeholder="Ajouter une icône"
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

.icon-position-select {
  margin-top: 8px;
}
</style>
