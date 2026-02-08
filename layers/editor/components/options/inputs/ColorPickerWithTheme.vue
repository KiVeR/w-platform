<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  value: string | undefined
  themeColorType: 'primary' | 'secondary'
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:value', value: string | undefined): void
}>()

const { primaryColor, secondaryColor, isUsingGlobalColor } = useGlobalStyles()

const isPrimaryType = computed(() => props.themeColorType === 'primary')

const themeColor = computed(() =>
  isPrimaryType.value ? primaryColor.value : secondaryColor.value,
)

const themeColorLabel = computed(() =>
  isPrimaryType.value ? 'principale' : 'secondaire',
)

const usesTheme = computed(() => isUsingGlobalColor(props.value))

const localValue = ref(props.value || themeColor.value)

watch(() => props.value, (newValue) => {
  localValue.value = newValue || themeColor.value
})

watch(themeColor, (newColor) => {
  if (usesTheme.value) {
    localValue.value = newColor
  }
})

function handleColorInput(event: Event) {
  const target = event.target as HTMLInputElement
  localValue.value = target.value
  emit('update:value', target.value)
}

function handleTextInput(event: Event) {
  const target = event.target as HTMLInputElement
  let value = target.value

  if (value && !value.startsWith('#')) {
    value = `#${value}`
  }

  if (/^#(?:[0-9A-F]{3}|[0-9A-F]{6})$/i.test(value)) {
    localValue.value = value
    emit('update:value', value)
  }
}

function useThemeColor() {
  localValue.value = themeColor.value
  emit('update:value', undefined)
}

function useCustomColor() {
  emit('update:value', themeColor.value)
}
</script>

<template>
  <div class="color-picker-with-theme">
    <div class="picker-row">
      <input
        type="color"
        class="color-input"
        :value="localValue"
        :disabled="usesTheme"
        @input="handleColorInput"
      >
      <input
        type="text"
        class="color-text"
        :value="localValue"
        :disabled="usesTheme"
        placeholder="#000000"
        maxlength="7"
        @change="handleTextInput"
      >
      <button
        v-if="!usesTheme"
        class="reset-btn"
        type="button"
        title="Utiliser la couleur du thème"
        @click="useThemeColor"
      >
        🔗
      </button>
    </div>

    <div class="theme-toggle">
      <label class="toggle-label">
        <input
          type="checkbox"
          :checked="usesTheme"
          @change="usesTheme ? useCustomColor() : useThemeColor()"
        >
        <span class="toggle-text">
          Utiliser la couleur {{ themeColorLabel }}
        </span>
        <span v-if="usesTheme" class="theme-preview" :style="{ backgroundColor: themeColor }" />
      </label>
    </div>
  </div>
</template>

<style scoped>
.color-picker-with-theme {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 40px;
  height: 40px;
  padding: 2px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: var(--color-surface);
  transition: opacity 0.2s;
}

.color-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

.color-text {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: monospace;
  text-transform: uppercase;
  transition: opacity 0.2s;
}

.color-text:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-surface-dim);
}

.color-text:focus {
  outline: none;
  border-color: var(--color-primary);
}

.reset-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.reset-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-50);
}

.theme-toggle {
  padding-left: 4px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-muted);
}

.toggle-label input[type="checkbox"] {
  accent-color: var(--color-primary);
}

.toggle-text {
  flex: 1;
}

.theme-preview {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
