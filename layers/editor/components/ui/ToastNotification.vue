<script setup lang="ts">
import type { Component } from 'vue'
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

const props = withDefaults(defineProps<{
  type?: ToastType
  title?: string
  message: string
  duration?: number
  dismissible?: boolean
  actions?: ToastAction[]
  icon?: Component
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
  if (props.icon)
    return props.icon
  switch (props.type) {
    case 'success': return CheckCircle
    case 'error': return XCircle
    case 'warning': return AlertCircle
    default: return Info
  }
})

const hasActions = computed(() => props.actions && props.actions.length > 0)

function close() {
  isVisible.value = false
  emit('close')
}

function handleAction(action: ToastAction) {
  action.onClick()
  close()
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
      :class="[type, { 'has-actions': hasActions }]"
      role="alert"
      :aria-live="type === 'error' ? 'assertive' : 'polite'"
    >
      <div class="toast-content">
        <component :is="iconComponent" :size="18" class="toast-icon" />
        <div class="toast-text">
          <p v-if="title" class="toast-title">
            {{ title }}
          </p>
          <p class="toast-message">
            {{ message }}
          </p>
        </div>
      </div>

      <div v-if="hasActions" class="toast-actions">
        <button
          v-for="action in actions"
          :key="action.label"
          class="toast-action"
          :class="action.variant || 'primary'"
          @click="handleAction(action)"
        >
          {{ action.label }}
        </button>
      </div>

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
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 280px;
  max-width: 420px;
  background: white;
}

.toast.has-actions {
  flex-direction: column;
  align-items: stretch;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  flex: 1;
}

.toast-text {
  flex: 1;
  min-width: 0;
}

.toast-title {
  margin: 0 0 var(--space-1);
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.3;
}

.toast-message {
  flex: 1;
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.4;
}

.toast-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid currentColor;
  border-top-color: rgba(0, 0, 0, 0.1);
}

.toast-action {
  padding: var(--space-1) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toast-action.primary {
  background: currentColor;
  color: white;
}

.toast-action.primary:hover {
  opacity: 0.9;
}

.toast-action.secondary {
  background: transparent;
  color: inherit;
  opacity: 0.7;
}

.toast-action.secondary:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

/* Types */
.toast.success {
  background: var(--color-success-50);
  border: 1px solid var(--color-success-200);
  color: var(--color-success-700);
}

.toast.success .toast-action.primary {
  background: var(--color-success-600);
}

.toast.error {
  background: var(--color-error-50);
  border: 1px solid var(--color-error-200);
  color: var(--color-error-700);
}

.toast.error .toast-action.primary {
  background: var(--color-error-600);
}

.toast.warning {
  background: var(--color-warning-50);
  border: 1px solid var(--color-warning-200);
  color: var(--color-warning-700);
}

.toast.warning .toast-action.primary {
  background: var(--color-warning-600);
}

.toast.info {
  background: var(--color-info-50);
  border: 1px solid var(--color-info-200);
  color: var(--color-info-700);
}

.toast.info .toast-action.primary {
  background: var(--color-info-600);
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 1px;
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
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
}

.toast {
  position: relative;
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
