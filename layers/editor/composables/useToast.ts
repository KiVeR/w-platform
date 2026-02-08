export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export interface Toast {
  id: number
  type: ToastType
  title?: string
  message: string
  duration: number
  actions?: ToastAction[]
  icon?: Component
}

export interface ToastOptions {
  title?: string
  duration?: number
  actions?: ToastAction[]
  icon?: Component
}

// Singleton state for global toast management
const toasts: Ref<Toast[]> = ref([])
let nextId = 0

function addToast(type: ToastType, message: string, options: ToastOptions = {}): number {
  const id = nextId++
  const toast: Toast = {
    id,
    type,
    message,
    title: options.title,
    duration: options.duration ?? (options.actions ? 8000 : 4000),
    actions: options.actions,
    icon: options.icon,
  }
  toasts.value.push(toast)
  return id
}

function removeToast(id: number): void {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

function clearAll(): void {
  toasts.value = []
}

export function useToast() {
  return {
    toasts,
    success: (message: string, options?: ToastOptions) => addToast('success', message, options),
    error: (message: string, options?: ToastOptions) => addToast('error', message, options),
    warning: (message: string, options?: ToastOptions) => addToast('warning', message, options),
    info: (message: string, options?: ToastOptions) => addToast('info', message, options),
    remove: removeToast,
    clearAll,
  }
}
