<script setup lang="ts">
import { computed } from 'vue'
import { useGlobalStyles } from '@/composables/useGlobalStyles'

const props = defineProps<{
  colorType: 'primary' | 'secondary'
  show: boolean
}>()

const { primaryColor, secondaryColor } = useGlobalStyles()

const tooltipText = computed(() =>
  props.colorType === 'primary'
    ? 'Utilise la couleur principale'
    : 'Utilise la couleur secondaire',
)

const currentColor = computed(() =>
  props.colorType === 'primary' ? primaryColor.value : secondaryColor.value,
)
</script>

<template>
  <div
    v-if="show"
    class="global-color-indicator"
    :title="tooltipText"
  >
    <span class="indicator-icon">🔗</span>
    <span class="color-preview" :style="{ backgroundColor: currentColor }" />
  </div>
</template>

<style scoped>
.global-color-indicator {
  position: absolute;
  top: -6px;
  right: -6px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  font-size: 10px;
  z-index: 10;
  cursor: help;
  transition: transform 0.15s ease;
}

.global-color-indicator:hover {
  transform: scale(1.1);
}

.indicator-icon {
  line-height: 1;
}

.color-preview {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
