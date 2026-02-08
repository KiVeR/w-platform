<script setup lang="ts">
import type { Widget } from '../../types/widget'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import OptionTextarea from '../shared/OptionTextarea.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

const ratingOptions = [
  { value: 0, label: 'Pas de note' },
  { value: 1, label: '★ (1/5)' },
  { value: 2, label: '★★ (2/5)' },
  { value: 3, label: '★★★ (3/5)' },
  { value: 4, label: '★★★★ (4/5)' },
  { value: 5, label: '★★★★★ (5/5)' },
]
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Citation *" required>
      <OptionTextarea
        :model-value="widget.content.quote"
        placeholder="Excellent service, je recommande !"
        :rows="3"
        @update:model-value="updateContent('quote', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Auteur *" required>
      <OptionInput
        :model-value="widget.content.author"
        placeholder="Marie D."
        @update:model-value="updateContent('author', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Rôle / Titre">
      <OptionInput
        :model-value="widget.content.role"
        placeholder="Cliente depuis 2024"
        @update:model-value="updateContent('role', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Entreprise">
      <OptionInput
        :model-value="widget.content.company"
        placeholder="Nom de l'entreprise"
        @update:model-value="updateContent('company', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Photo (URL)">
      <OptionInput
        :model-value="widget.content.avatarUrl"
        type="url"
        placeholder="https://..."
        @update:model-value="updateContent('avatarUrl', $event)"
      />
      <img
        v-if="widget.content.avatarUrl"
        :src="widget.content.avatarUrl"
        alt="Aperçu"
        class="avatar-preview"
      >
    </OptionGroup>

    <OptionGroup label="Note">
      <OptionSelect
        :model-value="widget.content.rating || 0"
        :options="ratingOptions"
        @update:model-value="updateContent('rating', Number($event))"
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

.avatar-preview {
  margin-top: var(--space-2);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-border);
}
</style>
