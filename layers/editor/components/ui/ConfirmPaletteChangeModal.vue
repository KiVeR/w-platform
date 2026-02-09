<script setup lang="ts">
import { AlertTriangle, X } from 'lucide-vue-next'
import { ref } from 'vue'

const emit = defineEmits<{
  confirm: [dontAskAgain: boolean]
  saveFirst: []
  cancel: []
}>()

const dontAskAgain = ref(false)

function handleConfirm() {
  emit('confirm', dontAskAgain.value)
}

function handleSaveFirst() {
  emit('saveFirst')
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="handleCancel">
      <div class="modal-content">
        <button class="modal-close" type="button" @click="handleCancel">
          <X :size="20" />
        </button>

        <div class="modal-icon">
          <AlertTriangle :size="48" class="icon" />
        </div>

        <h2>Modifications non enregistrées</h2>

        <p class="modal-description">
          Vous avez modifié les couleurs de la palette actuelle.
          Changer de palette annulera ces modifications.
        </p>

        <label class="checkbox-label">
          <input
            v-model="dontAskAgain"
            type="checkbox"
            class="checkbox"
          >
          <span>Ne plus me demander (session)</span>
        </label>

        <div class="modal-actions">
          <button
            type="button"
            class="btn-secondary"
            @click="handleCancel"
          >
            Annuler
          </button>
          <button
            type="button"
            class="btn-outline"
            @click="handleSaveFirst"
          >
            Enregistrer d'abord
          </button>
          <button
            type="button"
            class="btn-warning"
            @click="handleConfirm"
          >
            Changer
          </button>
        </div>
      </div>
    </div>
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
}

.modal-content {
  position: relative;
  background-color: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 32px;
  max-width: 480px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-neutral-400);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.15s;
}

.modal-close:hover {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-600);
}

.modal-icon {
  margin-bottom: 16px;
}

.icon {
  color: var(--color-warning-500);
}

h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-neutral-800);
  margin: 0 0 12px;
}

.modal-description {
  color: var(--color-neutral-500);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-neutral-500);
}

.checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary, #14b8a6);
  cursor: pointer;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-secondary {
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-600);
  border: none;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: var(--color-neutral-200);
}

.btn-outline {
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background-color: var(--color-surface);
  color: var(--color-primary, #14b8a6);
  border: 1px solid var(--color-primary, #14b8a6);
  transition: all 0.2s;
}

.btn-outline:hover {
  background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
}

.btn-warning {
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background-color: var(--color-warning-500);
  color: var(--color-surface);
  border: none;
  transition: background-color 0.2s;
}

.btn-warning:hover {
  background-color: var(--color-warning-600);
}
</style>
