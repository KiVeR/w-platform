<script setup lang="ts">
import { X } from 'lucide-vue-next'
import OptionCheckbox from '../shared/OptionCheckbox.vue'
import OptionColorPicker from '../shared/OptionColorPicker.vue'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

function addImage(): void {
  const images = [...(props.widget.content.sliderImages || [])]
  images.push({ src: '', alt: '' })
  updateContent('sliderImages', images)
}

function removeImage(index: number): void {
  const images = [...(props.widget.content.sliderImages || [])]
  images.splice(index, 1)
  updateContent('sliderImages', images)
}

function updateImage(index: number, key: keyof GalleryImage, value: string): void {
  const images = [...(props.widget.content.sliderImages || [])]
  if (images[index]) {
    images[index] = { ...images[index], [key]: value }
    updateContent('sliderImages', images)
  }
}
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Intervalle (ms)">
      <OptionInput
        :model-value="widget.content.sliderInterval"
        type="number"
        placeholder="3000"
        @update:model-value="updateContent('sliderInterval', parseInt($event) || 3000)"
      />
    </OptionGroup>

    <OptionGroup label="Couleur des chevrons">
      <OptionColorPicker
        :model-value="widget.content.sliderChevronColor || '#ffffff'"
        @update:model-value="updateContent('sliderChevronColor', $event)"
      />
    </OptionGroup>

    <OptionCheckbox
      :model-value="widget.content.sliderAutoplay !== false"
      label="Lecture automatique"
      @update:model-value="updateContent('sliderAutoplay', $event)"
    />

    <div class="images-section">
      <label class="images-label">
        Images ({{ (widget.content.sliderImages || []).length }})
      </label>

      <div class="images-list">
        <div
          v-for="(image, index) in (widget.content.sliderImages || [])"
          :key="index"
          class="image-item"
        >
          <div class="image-header">
            <span class="image-name">Slide {{ index + 1 }}</span>
            <button
              type="button"
              class="remove-btn"
              aria-label="Supprimer cette slide"
              @click="removeImage(index)"
            >
              <X :size="12" />
            </button>
          </div>
          <OptionInput
            :model-value="image.src"
            type="url"
            placeholder="URL de l'image *"
            @update:model-value="updateImage(index, 'src', $event)"
          />
          <OptionInput
            :model-value="image.alt"
            placeholder="Texte alt"
            @update:model-value="updateImage(index, 'alt', $event)"
          />
        </div>
      </div>

      <button type="button" class="add-btn" @click="addImage">
        + Ajouter une slide
      </button>
    </div>
  </div>
</template>

<style scoped>
.options-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.images-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.images-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.images-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.image-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.image-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-1);
}

.image-name {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
}

.remove-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--color-error-100);
  color: var(--color-error);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.remove-btn:hover {
  background: var(--color-error-200);
}

.add-btn {
  padding: var(--space-2);
  border: 2px dashed var(--color-border);
  background: transparent;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
}

.add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
