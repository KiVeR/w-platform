<script setup lang="ts">
import type { Widget } from '@/types/widget'
import { Map, MapPin, Mountain, Satellite } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  widget: Widget
  editable?: boolean
}>()

// Génération de l'URL Google Maps Embed
const mapEmbedUrl = computed(() => {
  const address = props.widget.content.address
  const lat = props.widget.content.latitude
  const lng = props.widget.content.longitude
  const zoom = props.widget.content.zoom || 15
  const mapType = props.widget.content.mapStyle || 'roadmap'

  // Si on a des coordonnées précises
  if (lat && lng) {
    return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&t=${mapType.charAt(0)}&output=embed`
  }

  // Si on a une adresse
  if (address) {
    const encodedAddress = encodeURIComponent(address)
    return `https://maps.google.com/maps?q=${encodedAddress}&z=${zoom}&t=${mapType.charAt(0)}&output=embed`
  }

  return ''
})

const hasMap = computed(() => !!mapEmbedUrl.value)

const mapStyleLabel = computed(() => {
  switch (props.widget.content.mapStyle) {
    case 'satellite': return 'Satellite'
    case 'hybrid': return 'Hybride'
    case 'terrain': return 'Terrain'
    default: return 'Plan'
  }
})
</script>

<template>
  <div
    class="map-widget"
    :style="{
      borderRadius: widget.styles.borderRadius,
      padding: widget.styles.padding,
      margin: widget.styles.margin,
    }"
  >
    <!-- Carte Google Maps -->
    <div v-if="hasMap" class="map-container">
      <div class="map-badge">
        <span class="badge-content"><MapPin :size="12" /> {{ mapStyleLabel }}</span>
      </div>
      <iframe
        :src="mapEmbedUrl"
        frameborder="0"
        allowfullscreen
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        class="map-iframe"
      />
      <div v-if="widget.content.address" class="map-address-overlay">
        <span class="address-text">{{ widget.content.address }}</span>
      </div>
    </div>

    <!-- Placeholder -->
    <div v-else class="map-placeholder">
      <div class="placeholder-icon">
        <MapPin :size="48" />
      </div>
      <p class="placeholder-text">
        Configurer la carte
      </p>
      <p class="placeholder-hint">
        Entrez une adresse ou des coordonnées
      </p>
      <div class="map-styles-preview">
        <span class="style-chip active"><Map :size="10" /> Plan</span>
        <span class="style-chip"><Satellite :size="10" /> Satellite</span>
        <span class="style-chip"><Mountain :size="10" /> Terrain</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-widget {
  overflow: hidden;
}

.map-container {
  position: relative;
  width: 100%;
  height: 250px;
  background: #e5e7eb;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.map-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  background: white;
  color: #1f2937;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.map-iframe {
  width: 100%;
  height: 100%;
  border: 0;
}

.map-address-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 24px 12px 12px;
}

.address-text {
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.map-placeholder {
  width: 100%;
  min-height: 200px;
  background-color: #f1f5f9;
  border: 2px dashed #cbd5e1;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.placeholder-icon {
  margin-bottom: 8px;
}

.badge-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.placeholder-text {
  font-size: 14px;
}

.placeholder-hint {
  font-size: 12px;
  margin-top: 4px;
}

.map-styles-preview {
  display: flex;
  gap: 6px;
}

.style-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: white;
  border-radius: var(--radius-xl);
  font-size: 10px;
  color: #666;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.style-chip.active {
  background: #4caf50;
  color: white;
}
</style>
