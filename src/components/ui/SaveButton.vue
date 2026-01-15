<script setup lang="ts">
import { Check, Loader2, Save, X } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  status: 'idle' | 'saving' | 'saved' | 'error'
  disabled?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const statusConfig = computed(() => {
  switch (props.status) {
    case 'saving':
      return { icon: Loader2, text: 'Sauvegarde...', class: 'saving' }
    case 'saved':
      return { icon: Check, text: 'Sauvegardé', class: 'saved' }
    case 'error':
      return { icon: X, text: 'Erreur', class: 'error' }
    default:
      return { icon: Save, text: 'Sauvegarder', class: 'idle' }
  }
})

const isDisabled = computed(() => {
  return props.disabled || props.status === 'saving'
})
</script>

<template>
  <button
    class="save-button"
    :class="statusConfig.class"
    :disabled="isDisabled"
    :aria-label="statusConfig.text"
    :aria-busy="status === 'saving'"
    @click="emit('click')"
  >
    <component
      :is="statusConfig.icon"
      :size="16"
      :class="{ spinning: status === 'saving' }"
    />
    <span class="save-text">{{ statusConfig.text }}</span>
  </button>
</template>

<style scoped>
.save-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.save-button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.save-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Idle state */
.save-button.idle {
  background: var(--color-primary);
  color: white;
}

.save-button.idle:hover:not(:disabled) {
  background: var(--color-primary-600);
}

/* Saving state */
.save-button.saving {
  background: var(--color-neutral-200);
  color: var(--color-text-muted);
}

/* Saved state */
.save-button.saved {
  background: var(--color-success-100);
  color: var(--color-success);
}

/* Error state */
.save-button.error {
  background: var(--color-error-100);
  color: var(--color-error);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.save-text {
  white-space: nowrap;
}
</style>
