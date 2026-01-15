<script setup lang="ts">
import type { ToastType } from './ToastNotification.vue'
import { ref } from 'vue'
import ToastNotification from './ToastNotification.vue'

interface Toast {
  id: number
  type: ToastType
  message: string
  duration?: number
}

const toasts = ref<Toast[]>([])
let nextId = 0

function addToast(type: ToastType, message: string, duration = 4000) {
  const id = nextId++
  toasts.value.push({ id, type, message, duration })
  return id
}

function removeToast(id: number) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

// Expose methods for parent components
defineExpose({
  success: (message: string, duration?: number) => addToast('success', message, duration),
  error: (message: string, duration?: number) => addToast('error', message, duration),
  warning: (message: string, duration?: number) => addToast('warning', message, duration),
  info: (message: string, duration?: number) => addToast('info', message, duration),
  remove: removeToast,
})
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite" aria-label="Notifications">
      <TransitionGroup name="toast-list">
        <ToastNotification
          v-for="toast in toasts"
          :key="toast.id"
          :type="toast.type"
          :message="toast.message"
          :duration="toast.duration"
          @close="removeToast(toast.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
}

.toast-container > * {
  pointer-events: auto;
}

/* TransitionGroup animations */
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all var(--transition-normal);
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-list-move {
  transition: transform var(--transition-normal);
}
</style>
