<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { computed } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

const stores = computed(() => props.widget.content.driveStores || [])
const hasStores = computed(() => stores.value.length > 0)

const buttonText = computed(() => props.widget.content.driveButtonText || 'Trouver le magasin le plus proche')
const buttonColor = computed(() => props.widget.content.driveButtonColor || '#14b8a6')
const btnGoLabel = computed(() => props.widget.content.driveBtnGoLabel || 'S\'y rendre')
const btnCallLabel = computed(() => props.widget.content.driveBtnCallLabel || 'Appeler')
const btnGoColor = computed(() => props.widget.content.driveBtnGoColor || '#14b8a6')
const btnCallColor = computed(() => props.widget.content.driveBtnCallColor || '#6366f1')
</script>

<template>
  <div
    class="drive-widget"
    :style="{
      padding: widget.styles.padding,
      margin: widget.styles.margin,
      textAlign: widget.styles.textAlign,
    }"
  >
    <!-- Bouton principal -->
    <button
      class="drive-button"
      :style="{
        backgroundColor: buttonColor,
        borderColor: buttonColor,
      }"
      @click.prevent
    >
      <span class="button-icon">🚗</span>
      {{ buttonText }}
    </button>

    <!-- Preview du magasin le plus proche (simulation) -->
    <div v-if="hasStores && stores[0]" class="drive-preview">
      <div class="preview-title">
        Magasin le plus proche :
      </div>
      <div class="store-card">
        <div class="store-info">
          <div class="store-name">
            {{ stores[0]?.name }}
          </div>
          <div class="store-address">
            {{ stores[0]?.address }}
          </div>
          <div v-if="stores[0]?.openingHours" class="store-hours">
            {{ stores[0]?.openingHours }}
          </div>
        </div>
        <div class="store-actions">
          <button
            class="action-btn"
            :style="{ borderColor: btnGoColor, color: btnGoColor }"
          >
            📍 {{ btnGoLabel }}
          </button>
          <button
            v-if="stores[0]?.phone"
            class="action-btn"
            :style="{ borderColor: btnCallColor, color: btnCallColor }"
          >
            📞 {{ btnCallLabel }}
          </button>
        </div>
      </div>
      <div v-if="stores.length > 1" class="more-stores">
        +{{ stores.length - 1 }} autre{{ stores.length > 2 ? 's' : '' }} magasin{{ stores.length > 2 ? 's' : '' }}
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="drive-empty">
      <p class="empty-text">
        Aucun magasin configuré
      </p>
      <p class="empty-hint">
        Ajoutez des magasins dans les options pour activer la géolocalisation
      </p>
    </div>
  </div>
</template>

<style scoped>
.drive-widget {
  width: 100%;
}

.drive-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border: 2px solid;
  background: var(--btn-color);
  color: white;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.drive-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.button-icon {
  font-size: 20px;
}

.drive-preview {
  margin-top: 20px;
  text-align: left;
}

.preview-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 8px;
  text-align: center;
}

.store-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.store-info {
  margin-bottom: 12px;
}

.store-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.store-address {
  font-size: 14px;
  color: #64748b;
}

.store-hours {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
}

.store-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 100px;
  padding: 8px 12px;
  border: 2px solid;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  opacity: 0.8;
}

.more-stores {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  margin-top: 8px;
}

.drive-empty {
  margin-top: 16px;
  padding: 24px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
}

.empty-text {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.empty-hint {
  color: #94a3b8;
  font-size: 12px;
  margin: 0;
}
</style>
