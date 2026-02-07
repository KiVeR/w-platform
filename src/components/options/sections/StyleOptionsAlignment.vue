<script setup lang="ts">
import type { Widget } from '@/types/widget'

defineProps<{
  widget: Widget
  isButtonWidget: boolean
}>()

const emit = defineEmits<{
  'update:style': [key: string, value: string | undefined]
}>()

function updateStyle(key: string, value: string | undefined) {
  emit('update:style', key, value)
}

const widthModes = [
  { value: 'auto', label: 'Auto' },
  { value: 'full', label: 'Pleine largeur' },
]
const textAligns = [
  { value: 'left', label: '⬅ Gauche' },
  { value: 'center', label: '↔ Centre' },
  { value: 'right', label: '➡ Droite' },
]
</script>

<template>
  <!-- Width Mode (buttons only) -->
  <div v-if="isButtonWidget" class="option-group">
    <label class="option-label">Largeur</label>
    <div class="align-buttons">
      <button
        v-for="mode in widthModes"
        :key="mode.value"
        class="align-btn"
        :class="{ active: (widget.styles.widthMode || 'full') === mode.value }"
        @click="updateStyle('widthMode', mode.value)"
      >
        {{ mode.label }}
      </button>
    </div>
  </div>

  <!-- Text Align -->
  <div
    v-if="['title', 'text'].includes(widget.type) || (isButtonWidget && widget.styles.widthMode === 'auto')"
    class="option-group"
  >
    <label class="option-label">Alignement</label>
    <div class="align-buttons">
      <button
        v-for="align in textAligns"
        :key="align.value"
        class="align-btn"
        :class="{ active: (widget.styles.textAlign || 'center') === align.value }"
        @click="updateStyle('textAlign', align.value)"
      >
        {{ align.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.option-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.align-buttons {
  display: flex;
  gap: 4px;
}

.align-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.align-btn:hover {
  border-color: var(--color-primary);
}

.align-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
</style>
