<script setup lang="ts">
import OptionGroup from '../shared/OptionGroup.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import OptionSlider from '../shared/OptionSlider.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

const effectEmojis = ['❄️', '🎉', '✨', '🌟', '💫', '🍂', '🌸', '🎈', '💖', '⭐']

const directionOptions = [
  { value: 'down', label: 'Vers le bas' },
  { value: 'up', label: 'Vers le haut' },
]
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Particule (emoji)">
      <div class="icon-picker">
        <input
          type="text"
          class="icon-input"
          :value="widget.content.effectImage"
          placeholder="❄️"
          @input="updateContent('effectImage', ($event.target as HTMLInputElement).value)"
        >
        <div class="icon-suggestions">
          <button
            v-for="emoji in effectEmojis"
            :key="emoji"
            type="button"
            class="emoji-btn"
            @click="updateContent('effectImage', emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </OptionGroup>

    <OptionGroup label="Taille">
      <OptionSlider
        :model-value="widget.content.effectSize || 20"
        :min="10"
        :max="60"
        unit="px"
        @update:model-value="updateContent('effectSize', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Nombre de particules">
      <OptionSlider
        :model-value="widget.content.effectNbItems || 50"
        :min="10"
        :max="100"
        @update:model-value="updateContent('effectNbItems', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Vitesse">
      <OptionSlider
        :model-value="widget.content.effectSpeed || 50"
        :min="10"
        :max="100"
        unit="%"
        @update:model-value="updateContent('effectSpeed', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Direction">
      <OptionSelect
        :model-value="widget.content.effectDirection || 'down'"
        :options="directionOptions"
        @update:model-value="updateContent('effectDirection', $event as 'down' | 'up')"
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
