<script setup lang="ts">
import type { Widget } from '@/types/widget'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

const popularEmojis = ['⭐', '❤️', '✅', '📞', '✉️', '📍', '💡', '🎯', '🔥', '✨', '👍', '🏆']

const sizeOptions = [
  { value: '24px', label: 'Petit (24px)' },
  { value: '36px', label: 'Moyen (36px)' },
  { value: '48px', label: 'Grand (48px)' },
  { value: '64px', label: 'Très grand (64px)' },
  { value: '96px', label: 'Énorme (96px)' },
]
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Icône (emoji)">
      <div class="icon-picker">
        <input
          type="text"
          class="icon-input"
          :value="widget.content.iconName"
          placeholder="⭐"
          @input="updateContent('iconName', ($event.target as HTMLInputElement).value)"
        >
        <div class="icon-suggestions">
          <button
            v-for="emoji in popularEmojis"
            :key="emoji"
            type="button"
            class="emoji-btn"
            @click="updateContent('iconName', emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </OptionGroup>

    <OptionGroup label="Taille">
      <OptionSelect
        :model-value="widget.content.iconSize"
        :options="sizeOptions"
        @update:model-value="updateContent('iconSize', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Lien (optionnel)">
      <OptionInput
        :model-value="widget.content.href"
        type="url"
        placeholder="https://..."
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

.icon-picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.icon-input {
  font-size: 24px;
  text-align: center;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.icon-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.icon-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.emoji-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.emoji-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-background);
  transform: scale(1.1);
}

.emoji-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
</style>
