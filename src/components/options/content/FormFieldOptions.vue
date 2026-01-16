<script setup lang="ts">
import type { FormFieldType, SelectOption, Widget } from '@/types/widget'
import { computed } from 'vue'
import { generateFieldName } from '@/utils/form'
import OptionCheckbox from '../shared/OptionCheckbox.vue'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import OptionTextarea from '../shared/OptionTextarea.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

const generatedName = computed(() => {
  return generateFieldName(props.widget.content.label || '')
})

const fieldTypes = [
  { value: 'text', label: 'Texte' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Téléphone' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'textarea', label: 'Zone de texte' },
  { value: 'select', label: 'Liste déroulante' },
  { value: 'checkbox', label: 'Case à cocher' },
  { value: 'radio', label: 'Boutons radio' },
]

const optionsText = computed({
  get: () => {
    const options = props.widget.content.options || []
    return options.map(option => `${option.value}::${option.label}`).join('\n')
  },
  set: (text: string) => {
    const options: SelectOption[] = text
      .split('\n')
      .filter(line => line.trim())
      .map((line) => {
        const [value, label] = line.split('::')
        const trimmedValue = value?.trim() || ''
        return { value: trimmedValue, label: label?.trim() || trimmedValue }
      })
    updateContent('options', options)
  },
})

const showPlaceholder = computed(() => {
  const type = props.widget.content.fieldType || ''
  return !['checkbox', 'radio'].includes(type)
})

const showOptions = computed(() => {
  const type = props.widget.content.fieldType || ''
  return ['select', 'radio'].includes(type)
})
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Type de champ" required>
      <OptionSelect
        :model-value="widget.content.fieldType"
        :options="fieldTypes"
        @update:model-value="updateContent('fieldType', $event as FormFieldType)"
      />
    </OptionGroup>

    <OptionGroup label="Label" required>
      <OptionInput
        :model-value="widget.content.label"
        placeholder="Votre nom"
        @update:model-value="updateContent('label', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Nom du champ" hint="Identifiant technique pour la soumission">
      <OptionInput
        :model-value="widget.content.name"
        :placeholder="generatedName || 'nom_du_champ'"
        @update:model-value="updateContent('name', $event)"
      />
      <small v-if="!widget.content.name && generatedName" class="auto-hint">
        Auto-généré : {{ generatedName }}
      </small>
    </OptionGroup>

    <OptionGroup v-if="showPlaceholder" label="Placeholder">
      <OptionInput
        :model-value="widget.content.placeholder"
        placeholder="Texte d'aide..."
        @update:model-value="updateContent('placeholder', $event)"
      />
    </OptionGroup>

    <OptionCheckbox
      :model-value="widget.content.required"
      label="Champ obligatoire"
      @update:model-value="updateContent('required', $event)"
    />

    <OptionGroup v-if="showOptions" label="Options" hint="Format: valeur::Label (une option par ligne)">
      <OptionTextarea
        :model-value="optionsText"
        placeholder="valeur::Label&#10;valeur2::Label 2"
        :rows="4"
        @update:model-value="optionsText = $event"
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

.auto-hint {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
