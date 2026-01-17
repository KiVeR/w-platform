<script setup lang="ts">
import { FileText, X } from 'lucide-vue-next'
import { ref } from 'vue'

const emit = defineEmits<{
  confirm: [title: string]
  cancel: []
}>()

const title = ref('')
const isSubmitting = ref(false)

function handleSubmit() {
  const trimmed = title.value.trim()
  if (!trimmed)
    return

  isSubmitting.value = true
  emit('confirm', trimmed)
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
          <FileText :size="48" class="icon" />
        </div>

        <h2>Nouvelle landing page</h2>

        <p class="modal-description">
          Donnez un titre a votre landing page pour la sauvegarder.
        </p>

        <form @submit.prevent="handleSubmit">
          <input
            v-model="title"
            type="text"
            placeholder="Titre de la landing page"
            class="title-input"
            autofocus
            required
            maxlength="200"
          >

          <div class="modal-actions">
            <button
              type="button"
              class="btn-secondary"
              :disabled="isSubmitting"
              @click="handleCancel"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="!title.trim() || isSubmitting"
            >
              {{ isSubmitting ? 'Creation...' : 'Creer et sauvegarder' }}
            </button>
          </div>
        </form>
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
  background-color: white;
  border-radius: var(--radius-xl);
  padding: 32px;
  max-width: 420px;
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
  color: #94a3b8;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.15s;
}

.modal-close:hover {
  background-color: #f1f5f9;
  color: #475569;
}

.modal-icon {
  margin-bottom: 16px;
}

.icon {
  color: #3b82f6;
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

.title-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-lg);
  font-size: 14px;
  color: #1e293b;
  transition: border-color 0.2s, box-shadow 0.2s;
  margin-bottom: 24px;
}

.title-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.title-input::placeholder {
  color: #94a3b8;
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
  background-color: #f1f5f9;
  color: #475569;
  border: none;
  transition: background-color 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e2e8f0;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background-color: #3b82f6;
  color: white;
  border: none;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
