<script setup lang="ts">
import { computed } from 'vue'
import OptionColorPicker from '../shared/OptionColorPicker.vue'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionIconSelect from '../shared/OptionIconSelect.vue'
import OptionInput from '../shared/OptionInput.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

const sizeOptions = [
  { value: '24px', label: 'Petit (24px)' },
  { value: '36px', label: 'Moyen (36px)' },
  { value: '48px', label: 'Grand (48px)' },
  { value: '64px', label: 'Très grand (64px)' },
  { value: '96px', label: 'Énorme (96px)' },
]

const currentIconName = computed(() => props.widget.content.iconName || '')
const currentIconComponent = computed(() => getLucideIcon(currentIconName.value))
</script>

<template>
  <div class="options-stack">
    <!-- Current icon preview -->
    <OptionGroup label="Icône sélectionnée">
      <div class="current-icon-preview">
        <div class="preview-icon">
          <component
            :is="currentIconComponent"
            v-if="currentIconComponent"
            :size="32"
          />
          <span v-else class="no-icon">Aucune</span>
        </div>
        <span class="preview-name">{{ currentIconName || 'Sélectionnez une icône' }}</span>
      </div>
    </OptionGroup>

    <!-- Icon picker -->
    <OptionGroup label="Icône">
      <OptionIconSelect
        :model-value="widget.content.iconName"
        placeholder="Choisir une icône"
        @update:model-value="updateContent('iconName', $event)"
      />
    </OptionGroup>

    <!-- Size -->
    <OptionGroup label="Taille">
      <OptionSelect
        :model-value="widget.content.iconSize"
        :options="sizeOptions"
        @update:model-value="updateContent('iconSize', $event)"
      />
    </OptionGroup>

    <!-- Color -->
    <OptionGroup label="Couleur">
      <OptionColorPicker
        :model-value="widget.content.iconColor"
        @update:model-value="updateContent('iconColor', $event)"
      />
    </OptionGroup>

    <!-- Link -->
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

.current-icon-preview {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.preview-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--color-background);
  border-radius: var(--radius-md);
  color: var(--color-text);
}

.no-icon {
  font-size: 12px;
  color: var(--color-text-muted);
}

.preview-name {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
}
</style>
