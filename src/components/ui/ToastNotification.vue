<script setup lang="ts">
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

const props = withDefaults(defineProps<{
  type?: ToastType
  message: string
  duration?: number
  dismissible?: boolean
}>(), {
  type: 'info',
  duration: 4000,
  dismissible: true,
})

const emit = defineEmits<{
  close: []
}>()

const isVisible = ref(true)
let timeoutId: ReturnType<typeof setTimeout> | null = null

const iconComponent = computed(() => {
  switch (props.type) {
    case 'success': return CheckCircle
    case 'error': return XCircle
    case 'warning': return AlertCircle
    default: return Info
  }
})

function close() {
  isVisible.value = false
  emit('close')
}

onMounted(() => {
  if (props.duration > 0) {
    timeoutId = setTimeout(close, props.duration)
  }
})

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
})
</script>

<template>
  <Transition name="toast">
    <div
      v-if="isVisible"
      class="toast"
      :class="type"
      role="alert"
      :aria-live="type === 'error' ? 'assertive' : 'polite'"
    >
      <component :is="iconComponent" :size="18" class="toast-icon" />
      <p class="toast-message">
        {{ message }}
      </p>
      <button
        v-if="dismissible"
        class="toast-close"
        aria-label="Fermer la notification"
        @click="close"
      >
        <X :size="14" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 280px;
  max-width: 400px;
}

/* Types */
.toast.success {
  background: var(--color-success-50);
  border: 1px solid var(--color-success-200);
  color: var(--color-success-700);
}

.toast.error {
  background: var(--color-error-50);
  border: 1px solid var(--color-error-200);
  color: var(--color-error-700);
}

.toast.warning {
  background: var(--color-warning-50);
  border: 1px solid var(--color-warning-200);
  color: var(--color-warning-700);
}

.toast.info {
  background: var(--color-info-50);
  border: 1px solid var(--color-info-200);
  color: var(--color-info-700);
}

.toast-icon {
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.4;
}

.toast-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.toast-close:hover {
  opacity: 1;
}

.toast-close:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-normal);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
