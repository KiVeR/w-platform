<script setup lang="ts">
import { AlertTriangle, X } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  template: TemplatePreset
  isOpen: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const modalRef = ref<HTMLDivElement>()
const confirmButtonRef = ref<HTMLButtonElement>()

// Focus trap
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('cancel')
  }

  // Tab trap
  if (event.key === 'Tab' && modalRef.value) {
    const focusable = modalRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    }
    else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }
}

// Focus on confirm button when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    setTimeout(() => {
      confirmButtonRef.value?.focus()
    }, 50)
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function handleOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('cancel')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        @click="handleOverlayClick"
      >
        <div ref="modalRef" class="modal-content">
          <button
            class="modal-close"
            aria-label="Fermer"
            @click="emit('cancel')"
          >
            <X :size="20" />
          </button>

          <div class="modal-header">
            <div class="warning-icon">
              <AlertTriangle :size="32" />
            </div>
            <h2 id="modal-title" class="modal-title">
              Appliquer le template
            </h2>
          </div>

          <div class="modal-body">
            <p class="template-name">
              « {{ template.name }} »
            </p>
            <p class="warning-text">
              <strong>Attention :</strong> Cette action remplacera tout le contenu actuel de votre page.
            </p>
            <p class="info-text">
              Les styles globaux et tous les widgets seront remplacés par ceux du template.
            </p>
          </div>

          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="emit('cancel')"
            >
              Annuler
            </button>
            <button
              ref="confirmButtonRef"
              class="btn btn-danger"
              @click="emit('confirm')"
            >
              Appliquer le template
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 200;
  padding: var(--space-4);
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 400px;
  background-color: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal-close {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background-color: var(--color-neutral-100);
  color: var(--color-text);
}

.modal-close:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-6) var(--space-4) var(--space-4);
  text-align: center;
}

.warning-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background-color: var(--color-warning-100);
  color: var(--color-warning-600);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-3);
}

.modal-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.modal-body {
  padding: 0 var(--space-4) var(--space-4);
  text-align: center;
}

.template-name {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 var(--space-3) 0;
}

.warning-text {
  font-size: var(--text-sm);
  color: var(--color-text);
  margin: 0 0 var(--space-2) 0;
  line-height: 1.5;
}

.info-text {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-neutral-50);
  border-top: 1px solid var(--color-border);
}

.btn {
  flex: 1;
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.btn-secondary {
  background-color: var(--color-neutral-100);
  color: var(--color-text);
}

.btn-secondary:hover {
  background-color: var(--color-neutral-200);
}

.btn-danger {
  background-color: var(--color-error-600);
  color: white;
}

.btn-danger:hover {
  background-color: var(--color-error-700);
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 200ms ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
