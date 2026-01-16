<script setup lang="ts">
import type { RecoveryData } from '@/composables/useRecovery'
import { AlertTriangle, Clock, FileText } from 'lucide-vue-next'

defineProps<{
  recoveryData: RecoveryData | null
}>()

const emit = defineEmits<{
  restore: []
  discard: []
}>()

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoString))
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-icon">
          <AlertTriangle :size="48" class="warning-icon" />
        </div>

        <h2>Version locale détectée</h2>

        <p class="modal-description">
          Une version non sauvegardée a été trouvée dans votre navigateur.
          Souhaitez-vous la restaurer ?
        </p>

        <div v-if="recoveryData" class="recovery-info">
          <div class="info-item">
            <Clock :size="16" />
            <span>Sauvegarde : {{ formatDate(recoveryData.savedAt) }}</span>
          </div>
          <div class="info-item">
            <FileText :size="16" />
            <span>{{ recoveryData.widgetCount }} widget(s)</span>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="emit('discard')">
            Ignorer
          </button>
          <button class="btn-primary" @click="emit('restore')">
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
  z-index: 200;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
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
  color: #f59e0b;
}

h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px;
}

.modal-description {
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 20px;
}

.recovery-info {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 14px;
}

.info-item + .info-item {
  margin-top: 8px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-secondary {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background-color: #f1f5f9;
  color: #475569;
  border: none;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #e2e8f0;
}

.btn-primary {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background-color: #3b82f6;
  color: white;
  border: none;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #2563eb;
}
</style>
