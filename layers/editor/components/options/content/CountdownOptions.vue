<script setup lang="ts">
import type { Widget } from '../../types/widget'
import OptionCheckbox from '../shared/OptionCheckbox.vue'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

function formatDateForInput(isoDate: string): string {
  if (!isoDate)
    return ''
  try {
    const date = new Date(isoDate)
    return date.toISOString().slice(0, 16)
  }
  catch {
    return ''
  }
}

function handleDateChange(value: string) {
  if (value) {
    updateContent('targetDate', new Date(value).toISOString())
  }
  else {
    updateContent('targetDate', '')
  }
}
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Date cible *" required>
      <input
        type="datetime-local"
        class="date-input"
        :value="formatDateForInput(widget.content.targetDate)"
        @input="handleDateChange(($event.target as HTMLInputElement).value)"
      >
    </OptionGroup>

    <OptionGroup label="Label avant le compte à rebours">
      <OptionInput
        :model-value="widget.content.label"
        placeholder="Fin de l'offre dans"
        @update:model-value="updateContent('label', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Message quand expiré">
      <OptionInput
        :model-value="widget.content.expiredLabel"
        placeholder="Offre terminée"
        @update:model-value="updateContent('expiredLabel', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Unités à afficher">
      <div class="checkbox-grid">
        <OptionCheckbox
          :model-value="widget.content.showDays !== false"
          label="Jours"
          @update:model-value="updateContent('showDays', $event)"
        />
        <OptionCheckbox
          :model-value="widget.content.showHours !== false"
          label="Heures"
          @update:model-value="updateContent('showHours', $event)"
        />
        <OptionCheckbox
          :model-value="widget.content.showMinutes !== false"
          label="Minutes"
          @update:model-value="updateContent('showMinutes', $event)"
        />
        <OptionCheckbox
          :model-value="widget.content.showSeconds !== false"
          label="Secondes"
          @update:model-value="updateContent('showSeconds', $event)"
        />
      </div>
    </OptionGroup>
  </div>
</template>

<style scoped>
.options-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.date-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--text-sm);
}

.date-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}
</style>
