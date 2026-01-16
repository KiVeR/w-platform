<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'

defineProps<{
  error?: string | null
  id?: string
}>()
</script>

<template>
  <Transition name="slide-fade">
    <div
      v-if="error"
      :id="id"
      class="validation-error"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle :size="14" class="error-icon" />
      <span>{{ error }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.validation-error {
  display: flex;
  align-items: flex-start;
  gap: var(--space-1, 4px);
  margin-top: var(--space-1, 4px);
  font-size: var(--text-xs, 12px);
  color: var(--color-error-600, #dc2626);
}

.error-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.slide-fade-enter-active {
  transition: all 150ms ease-out;
}

.slide-fade-leave-active {
  transition: all 100ms ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

.slide-fade-leave-to {
  opacity: 0;
}
</style>
