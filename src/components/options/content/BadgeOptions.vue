<script setup lang="ts">
import type { Widget } from '@/types/widget'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

const variantOptions = [
  { value: 'filled', label: 'Rempli (fond coloré)' },
  { value: 'outline', label: 'Contour (bordure)' },
]

const presetTexts = [
  'NOUVEAU',
  '-30%',
  '-50%',
  'PROMO',
  'BEST SELLER',
  'OFFRE LIMITÉE',
  'DERNIÈRES PLACES',
  'GRATUIT',
]
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Texte du badge *" required>
      <OptionInput
        :model-value="widget.content.text"
        placeholder="PROMO"
        @update:model-value="updateContent('text', $event)"
      />
      <div class="preset-badges">
        <button
          v-for="preset in presetTexts"
          :key="preset"
          type="button"
          class="preset-badge"
          @click="updateContent('text', preset)"
        >
          {{ preset }}
        </button>
      </div>
    </OptionGroup>

    <OptionGroup label="Style">
      <OptionSelect
        :model-value="widget.content.variant || 'filled'"
        :options="variantOptions"
        @update:model-value="updateContent('variant', $event)"
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

.preset-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

.preset-badge {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.preset-badge:hover {
  border-color: var(--color-primary);
  background: var(--color-background);
}

.preset-badge:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
</style>
