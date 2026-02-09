<script setup lang="ts">
import { MapPin } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const { primaryColor } = useGlobalStyles()

const stores = computed(() => props.widget.content.storeLocatorStores || [])
const hasStores = computed(() => stores.value.length > 0)

const buttonText = computed(() => props.widget.content.storeLocatorButtonText || 'Voir tous les lieux')
const buttonColor = computed(() => props.widget.content.storeLocatorButtonColor || primaryColor.value)
const label = computed(() => props.widget.content.storeLocatorLabel || 'Nos magasins')
</script>

<template>
  <div
    class="store-locator-widget"
    :style="{
      padding: widget.styles.padding,
      margin: widget.styles.margin,
      textAlign: widget.styles.textAlign,
    }"
  >
    <!-- Titre -->
    <h3 v-if="label" class="store-locator-label">
      {{ label }}
    </h3>

    <!-- Bouton principal (style GrapesJS original) -->
    <button
      class="store-locator-button"
      :style="{
        borderColor: buttonColor,
        color: buttonColor,
      }"
      @click.prevent
    >
      <MapPin :size="18" />
      {{ buttonText }}
    </button>

    <!-- Liste des magasins (preview) -->
    <div v-if="hasStores" class="stores-preview">
      <div class="stores-count">
        {{ stores.length }} lieu{{ stores.length > 1 ? 'x' : '' }} configuré{{ stores.length > 1 ? 's' : '' }}
      </div>
      <div class="stores-list">
        <div
          v-for="(store, index) in stores.slice(0, 3)"
          :key="index"
          class="store-item"
        >
          <div class="store-name">
            {{ store.name }}
          </div>
          <div class="store-address">
            {{ store.address }}
          </div>
        </div>
        <div v-if="stores.length > 3" class="stores-more">
          +{{ stores.length - 3 }} autres...
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="stores-empty">
      <p class="empty-text">
        Aucun lieu configuré
      </p>
      <p class="empty-hint">
        Ajoutez des lieux dans les options
      </p>
    </div>
  </div>
</template>

<style scoped>
.store-locator-widget {
  position: relative;
}

.store-locator-label {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-neutral-800);
  margin: 0 0 12px 0;
}

.store-locator-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: 2px solid;
  background: transparent;
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.store-locator-button:hover {
  opacity: 0.8;
}

.stores-preview {
  margin-top: 16px;
  padding: 12px;
  background: var(--color-neutral-50);
  border-radius: var(--radius-lg);
  text-align: left;
}

.stores-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-neutral-500);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.stores-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.store-item {
  padding: 8px;
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-neutral-200);
}

.store-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-neutral-800);
}

.store-address {
  font-size: 12px;
  color: var(--color-neutral-500);
  margin-top: 2px;
}

.stores-more {
  font-size: 12px;
  color: var(--color-neutral-500);
  font-style: italic;
  text-align: center;
  padding: 4px;
}

.stores-empty {
  margin-top: 16px;
  padding: 24px 16px;
  background: linear-gradient(135deg, var(--color-neutral-50) 0%, var(--color-neutral-200) 100%);
  border: 2px dashed var(--color-neutral-300);
  border-radius: var(--radius-lg);
}

.empty-text {
  color: var(--color-neutral-500);
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.empty-hint {
  color: var(--color-neutral-400);
  font-size: 12px;
  margin: 0;
}
</style>
