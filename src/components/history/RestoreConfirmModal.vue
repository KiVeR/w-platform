<script setup lang="ts">
import { AlertTriangle, Save } from 'lucide-vue-next'

defineProps<{
  versionNumber: string
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-modal-title"
      @click.self="$emit('cancel')"
      @keydown.escape="$emit('cancel')"
    >
      <div class="modal-content">
        <div class="modal-icon">
          <AlertTriangle :size="48" class="warning-icon" />
        </div>

        <h2 id="restore-modal-title">
          Restaurer la version {{ versionNumber }} ?
        </h2>

        <p class="modal-description">
          Le design actuel sera remplacé par cette version.
          Cette action ne peut pas être annulée.
        </p>

        <div class="info-box">
          <Save :size="16" />
          <span>Une sauvegarde automatique sera créée avant la restauration</span>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="$emit('cancel')">
            Annuler
          </button>
          <button class="btn-primary" @click="$emit('confirm')">
            Restaurer
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
  z-index: 300;
}

.modal-content {
  background-color: white;
  border-radius: var(--radius-xl);
  padding: 32px;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-icon {
  margin-bottom: 16px;
}

.warning-icon {
  color: var(--color-warning);
}

h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 12px;
}

.modal-description {
  color: var(--color-neutral-500);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 20px;
}

.info-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: var(--color-success-50);
  color: var(--color-success-700);
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  font-size: 13px;
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-secondary {
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background-color: var(--color-neutral-100);
  color: var(--color-text-secondary);
  border: none;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: var(--color-border);
}

.btn-primary {
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background-color: var(--color-info);
  color: white;
  border: none;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: var(--color-info-600);
}
</style>
