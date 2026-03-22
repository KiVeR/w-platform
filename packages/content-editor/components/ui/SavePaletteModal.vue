<script setup lang="ts">
import { Palette, X } from 'lucide-vue-next'
import { ref } from 'vue'

interface Props {
  currentColors: {
    backgroundColor: string
    textColor: string
    primaryColor: string
    secondaryColor: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [label: string]
  cancel: []
}>()

const label = ref('')
const isSubmitting = ref(false)
const error = ref('')

function handleSubmit() {
  const trimmed = label.value.trim()
  if (!trimmed) {
    error.value = 'Le nom est requis'
    return
  }
  if (trimmed.length > 100) {
    error.value = 'Le nom ne peut pas dépasser 100 caractères'
    return
  }

  isSubmitting.value = true
  error.value = ''
  emit('save', trimmed)
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
          <Palette :size="48" class="icon" />
        </div>

        <h2>Enregistrer la palette</h2>

        <p class="modal-description">
          Donnez un nom à votre palette personnalisée.
        </p>

        <!-- Color Preview -->
        <div class="color-preview">
          <div
            class="color-swatch"
            :style="{ backgroundColor: props.currentColors.backgroundColor }"
            title="Fond"
          />
          <div
            class="color-swatch"
            :style="{ backgroundColor: props.currentColors.textColor }"
            title="Texte"
          />
          <div
            class="color-swatch"
            :style="{ backgroundColor: props.currentColors.primaryColor }"
            title="Primaire"
          />
          <div
            class="color-swatch"
            :style="{ backgroundColor: props.currentColors.secondaryColor }"
            title="Secondaire"
          />
        </div>

        <form @submit.prevent="handleSubmit">
          <input
            v-model="label"
            type="text"
            placeholder="Nom de la palette"
            class="label-input"
            :class="{ 'has-error': error }"
            autofocus
            required
            maxlength="100"
          >
          <p v-if="error" class="error-message">
            {{ error }}
          </p>

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
              :disabled="!label.trim() || isSubmitting"
            >
              {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer' }}
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
  background-color: var(--color-surface);
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
  color: var(--color-primary);
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

.color-preview {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.color-swatch {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-neutral-200);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.label-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  font-size: 14px;
  color: var(--color-neutral-800);
  transition: border-color 0.2s, box-shadow 0.2s;
  margin-bottom: 8px;
}

.label-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.label-input.has-error {
  border-color: var(--color-error-500);
}

.label-input::placeholder {
  color: var(--color-neutral-400);
}

.error-message {
  color: var(--color-error-500);
  font-size: 12px;
  text-align: left;
  margin: 0 0 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
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

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-neutral-200);
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
  background-color: var(--color-primary);
  color: var(--color-surface);
  border: none;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
