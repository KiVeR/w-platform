<script setup lang="ts">
import type { GalleryImage, Widget } from '../../types/widget'
import { X } from 'lucide-vue-next'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

function addImage(): void {
  const images = [...(props.widget.content.galleryImages || [])]
  images.push({ src: '', alt: '' })
  updateContent('galleryImages', images)
}

function removeImage(index: number): void {
  const images = [...(props.widget.content.galleryImages || [])]
  images.splice(index, 1)
  updateContent('galleryImages', images)
}

function updateImage(index: number, key: keyof GalleryImage, value: string): void {
  const images = [...(props.widget.content.galleryImages || [])]
  if (images[index]) {
    images[index] = { ...images[index], [key]: value }
    updateContent('galleryImages', images)
  }
}
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Texte du bouton">
      <OptionInput
        :model-value="widget.content.galleryButtonText"
        placeholder="Voir la galerie"
        @update:model-value="updateContent('galleryButtonText', $event)"
      />
    </OptionGroup>

    <div class="images-section">
      <label class="images-label">
        Images ({{ (widget.content.galleryImages || []).length }})
      </label>

      <div class="images-list">
        <div
          v-for="(image, index) in (widget.content.galleryImages || [])"
          :key="index"
          class="image-item"
        >
          <div class="image-header">
            <span class="image-name">Image {{ index + 1 }}</span>
            <button
              type="button"
              class="remove-btn"
              aria-label="Supprimer cette image"
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
        + Ajouter une image
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
