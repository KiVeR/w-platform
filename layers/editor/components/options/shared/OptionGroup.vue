<script setup lang="ts">
defineProps<{
  label: string
  required?: boolean
  hint?: string
}>()
</script>

<template>
  <div class="option-group">
    <label class="option-label">
      {{ label }}
      <span v-if="required" class="required-mark">*</span>
    </label>
    <slot />
    <span v-if="hint" class="option-hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.option-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.option-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
}

.required-mark {
  color: var(--color-error);
  margin-left: 2px;
}

.option-hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-style: italic;
}
</style>
