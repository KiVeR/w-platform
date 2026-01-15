<script setup lang="ts">
import type { Widget } from '@/types/widget'
import OptionColorPicker from '../shared/OptionColorPicker.vue'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

const typeOptions = [
  { value: 'ean13', label: 'EAN-13 (13 chiffres)' },
  { value: 'ean8', label: 'EAN-8 (8 chiffres)' },
]
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Type de code barre">
      <OptionSelect
        :model-value="widget.content.barcodeType"
        :options="typeOptions"
        @update:model-value="updateContent('barcodeType', $event as 'ean13' | 'ean8')"
      />
    </OptionGroup>

    <OptionGroup
      label="Code"
      required
      :hint="widget.content.barcodeType === 'ean8'
        ? '7-8 chiffres pour EAN-8 (checksum calculé automatiquement)'
        : '12-13 chiffres pour EAN-13 (checksum calculé automatiquement)'"
    >
      <OptionInput
        :model-value="widget.content.barcodeCode"
        :placeholder="widget.content.barcodeType === 'ean8' ? '12345678' : '1234567890123'"
        @update:model-value="updateContent('barcodeCode', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Variable (optionnel)" hint="Utiliser une variable comme ${barcode} pour un code dynamique">
      <OptionInput
        :model-value="widget.content.barcodeVariable"
        placeholder="${barcode}"
        @update:model-value="updateContent('barcodeVariable', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Couleur">
      <OptionColorPicker
        :model-value="widget.content.barcodeColor || '#000000'"
        @update:model-value="updateContent('barcodeColor', $event)"
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
