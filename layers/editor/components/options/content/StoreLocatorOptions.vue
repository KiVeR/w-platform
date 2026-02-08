<script setup lang="ts">
import { X } from 'lucide-vue-next'
import OptionColorPicker from '../shared/OptionColorPicker.vue'
import OptionGroup from '../shared/OptionGroup.vue'
import OptionInput from '../shared/OptionInput.vue'
import { useWidgetContent } from '../shared/useWidgetContent'

const props = defineProps<{ widget: Widget }>()
const { updateContent } = useWidgetContent(props.widget)

function addStore(): void {
  const stores = [...(props.widget.content.storeLocatorStores || [])]
  stores.push({ name: '', address: '', latitude: 0, longitude: 0, phone: '' })
  updateContent('storeLocatorStores', stores)
}

function removeStore(index: number): void {
  const stores = [...(props.widget.content.storeLocatorStores || [])]
  stores.splice(index, 1)
  updateContent('storeLocatorStores', stores)
}

function updateStore(index: number, key: keyof StoreLocation, value: any): void {
  const stores = [...(props.widget.content.storeLocatorStores || [])]
  if (stores[index]) {
    stores[index] = { ...stores[index], [key]: value }
    updateContent('storeLocatorStores', stores)
  }
}
</script>

<template>
  <div class="options-stack">
    <OptionGroup label="Titre">
      <OptionInput
        :model-value="widget.content.storeLocatorLabel"
        placeholder="Nos magasins"
        @update:model-value="updateContent('storeLocatorLabel', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Texte du bouton">
      <OptionInput
        :model-value="widget.content.storeLocatorButtonText"
        placeholder="Voir tous les lieux"
        @update:model-value="updateContent('storeLocatorButtonText', $event)"
      />
    </OptionGroup>

    <OptionGroup label="Couleur du bouton">
      <OptionColorPicker
        :model-value="widget.content.storeLocatorButtonColor || '#14b8a6'"
        placeholder="#14b8a6"
        @update:model-value="updateContent('storeLocatorButtonColor', $event)"
      />
    </OptionGroup>

    <div class="stores-section">
      <label class="stores-label">
        Lieux ({{ (widget.content.storeLocatorStores || []).length }})
      </label>

      <div class="stores-list">
        <div
          v-for="(store, index) in (widget.content.storeLocatorStores || [])"
          :key="index"
          class="store-item"
        >
          <div class="store-header">
            <span class="store-name">{{ store.name || `Lieu ${index + 1}` }}</span>
            <button
              type="button"
              class="remove-btn"
              aria-label="Supprimer ce lieu"
              @click="removeStore(index)"
            >
              <X :size="12" />
            </button>
          </div>
          <OptionInput
            :model-value="store.name"
            placeholder="Nom du lieu *"
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
              placeholder="Latitude *"
              @input="updateStore(index, 'latitude', parseFloat(($event.target as HTMLInputElement).value))"
            >
            <input
              type="number"
              step="any"
              class="coord-input"
              :value="store.longitude"
              placeholder="Longitude *"
              @input="updateStore(index, 'longitude', parseFloat(($event.target as HTMLInputElement).value))"
            >
          </div>
          <OptionInput
            :model-value="store.phone"
            type="tel"
            placeholder="Téléphone (optionnel)"
            @update:model-value="updateStore(index, 'phone', $event)"
          />
        </div>
      </div>

      <button type="button" class="add-btn" @click="addStore">
        + Ajouter un lieu
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
  transition: background var(--transition-fast);
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
  box-shadow: var(--focus-ring);
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
