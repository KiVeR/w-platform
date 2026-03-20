<script setup lang="ts">
import { X } from 'lucide-vue-next'
import OptionColorPicker from '../shared/OptionColorPicker.vue'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

function addStore(): void {
  const stores = [...(props.widget.content.driveStores || [])]
  stores.push({ name: '', address: '', latitude: 0, longitude: 0, phone: '', openingHours: '' })
  updateContent('driveStores', stores)
}

function removeStore(index: number): void {
  const stores = [...(props.widget.content.driveStores || [])]
  stores.splice(index, 1)
  updateContent('driveStores', stores)
}

function updateStore(index: number, key: keyof StoreLocation, value: any): void {
  const stores = [...(props.widget.content.driveStores || [])]
  if (stores[index]) {
    stores[index] = { ...stores[index], [key]: value }
    updateContent('driveStores', stores)
  }
}
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Texte du bouton">
      <OptionInput
        :model-value="widget.content.driveButtonText"
        placeholder="Trouver le magasin le plus proche"
        @update:model-value="updateContent('driveButtonText', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Couleur du bouton">
      <OptionColorPicker
        :model-value="widget.content.driveButtonColor || '#14b8a6'"
        @update:model-value="updateContent('driveButtonColor', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Bouton 'S'y rendre'">
      <div class="inline-options">
        <OptionInput
          :model-value="widget.content.driveBtnGoLabel"
          placeholder="S'y rendre"
          @update:model-value="updateContent('driveBtnGoLabel', $event)"
        />
        <input
          type="color"
          class="color-small"
          :value="widget.content.driveBtnGoColor || '#14b8a6'"
          @input="updateContent('driveBtnGoColor', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </OptionGroup>

    <OptionGroup label="Bouton 'Appeler'">
      <div class="inline-options">
        <OptionInput
          :model-value="widget.content.driveBtnCallLabel"
          placeholder="Appeler"
          @update:model-value="updateContent('driveBtnCallLabel', $event)"
        />
        <input
          type="color"
          class="color-small"
          :value="widget.content.driveBtnCallColor || '#6366f1'"
          @input="updateContent('driveBtnCallColor', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </OptionGroup>

    <div class="stores-section">
      <label class="stores-label">
        Magasins ({{ (widget.content.driveStores || []).length }})
      </label>

      <div class="stores-list">
        <div
          v-for="(store, index) in (widget.content.driveStores || [])"
          :key="index"
          class="store-item"
        >
          <div class="store-header">
            <span class="store-name">{{ store.name || `Magasin ${index + 1}` }}</span>
            <button
              type="button"
              class="remove-btn"
              aria-label="Supprimer ce magasin"
              @click="removeStore(index)"
            >
              <X :size="12" />
            </button>
          </div>
          <OptionInput
            :model-value="store.name"
            placeholder="Nom *"
            @update:model-value="updateStore(index, 'name', $event)"
          />
          <OptionInput
            :model-value="store.address"
            placeholder="Adresse *"
            @update:model-value="updateStore(index, 'address', $event)"
          />
          <div class="coords-row">
            <input
              type="number"
              step="any"
              class="coord-input"
              :value="store.latitude"
              placeholder="Lat *"
              @input="updateStore(index, 'latitude', parseFloat(($event.target as HTMLInputElement).value))"
            >
            <input
              type="number"
              step="any"
              class="coord-input"
              :value="store.longitude"
              placeholder="Lng *"
              @input="updateStore(index, 'longitude', parseFloat(($event.target as HTMLInputElement).value))"
            >
          </div>
          <OptionInput
            :model-value="store.phone"
            type="tel"
            placeholder="Téléphone"
            @update:model-value="updateStore(index, 'phone', $event)"
          />
          <OptionInput
            :model-value="store.openingHours"
            placeholder="Horaires"
            @update:model-value="updateStore(index, 'openingHours', $event)"
          />
        </div>
      </div>

      <button type="button" class="add-btn" @click="addStore">
        + Ajouter un magasin
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

.inline-options {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.inline-options > :first-child {
  flex: 1;
}

.color-small {
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  padding: 2px;
}

.stores-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.stores-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.stores-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.store-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.store-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-1);
}

.store-name {
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

.coords-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.coord-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background-color: var(--color-surface);
}

.coord-input:focus {
  outline: none;
  border-color: var(--color-primary);
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
