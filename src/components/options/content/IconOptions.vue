<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import IconPicker from '@/components/ui/IconPicker.vue'
import { getLucideIcon, isEmoji } from '@/utils/lucide-icons'
import OptionColorPicker from '../shared/OptionColorPicker.vue'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import OptionSelect from '../shared/OptionSelect.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

const showPicker = ref(true)

const sizeOptions = [
  { value: '24px', label: 'Petit (24px)' },
  { value: '36px', label: 'Moyen (36px)' },
  { value: '48px', label: 'Grand (48px)' },
  { value: '64px', label: 'Très grand (64px)' },
  { value: '96px', label: 'Énorme (96px)' },
]

const currentIconName = computed(() => props.widget.content.iconName || '')
const currentIconComponent = computed(() => {
  if (isEmoji(currentIconName.value))
    return null
  return getLucideIcon(currentIconName.value)
})

function handleIconSelect(iconName: string) {
  updateContent('iconName', iconName)
}
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
          <span v-else-if="currentIconName" class="emoji-preview">{{ currentIconName }}</span>
          <span v-else class="no-icon">Aucune</span>
        </div>
        <span class="preview-name">{{ currentIconName || 'Sélectionnez une icône' }}</span>
      </div>
    </OptionGroup>

    <!-- Icon picker -->
    <OptionGroup>
      <template #label>
        <button
          type="button"
          class="picker-toggle"
          @click="showPicker = !showPicker"
        >
          <span>Bibliothèque d'icônes</span>
          <ChevronUp v-if="showPicker" :size="16" />
          <ChevronDown v-else :size="16" />
        </button>
      </template>
      <div v-if="showPicker" class="picker-container">
        <IconPicker
          :model-value="currentIconName"
          @select="handleIconSelect"
        />
      </div>
    </OptionGroup>

    <!-- Manual input for advanced users -->
    <OptionGroup label="Saisie manuelle">
      <OptionInput
        :model-value="widget.content.iconName"
        placeholder="Star, Phone, Mail..."
        hint="Nom d'icône Lucide ou emoji"
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

.emoji-preview {
  font-size: 32px;
  line-height: 1;
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

.picker-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.picker-toggle:hover {
  color: var(--color-text);
}

.picker-container {
  margin-top: var(--space-2);
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
</style>
