<script setup lang="ts">
import type { Widget } from '../../types/widget'
import OptionCheckbox from '../shared/OptionCheckbox.vue'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="URL de la vidéo" required hint="YouTube ou Vimeo détecté automatiquement">
      <OptionInput
        :model-value="widget.content.videoUrl"
        type="url"
        placeholder="https://youtube.com/watch?v=..."
        @update:model-value="updateContent('videoUrl', $event)"
      />
    </OptionGroup>

    <OptionCheckbox
      :model-value="widget.content.autoplay"
      label="Lecture automatique"
      @update:model-value="updateContent('autoplay', $event)"
    />

    <OptionCheckbox
      :model-value="widget.content.muted"
      label="Son coupé"
      @update:model-value="updateContent('muted', $event)"
    />

    <OptionCheckbox
      :model-value="widget.content.loop"
      label="Boucle"
      @update:model-value="updateContent('loop', $event)"
    />

    <OptionCheckbox
      :model-value="widget.content.controls !== false"
      label="Afficher les contrôles"
      @update:model-value="updateContent('controls', $event)"
    />
  </div>
</template>

<style scoped>
.options-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
