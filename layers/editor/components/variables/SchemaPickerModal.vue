<script setup lang="ts">
import { Braces, X } from 'lucide-vue-next'

const props = defineProps<{
  currentUuid?: string
}>()

const emit = defineEmits<{
  confirm: [schema: VariableSchemaListItem]
  cancel: []
}>()

const selected = ref<VariableSchemaListItem | null>(null)

function handleSelect(schema: VariableSchemaListItem) {
  selected.value = schema
}

function handleConfirm() {
  if (selected.value)
    emit('confirm', selected.value)
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
          <Braces :size="48" class="icon" />
        </div>

        <h2>Sélectionner un schéma de variables</h2>

        <p class="modal-description">
          Choisissez un schéma pour activer les variables dynamiques dans votre contenu.
        </p>

        <SchemaBrowser
          :selected-uuid="props.currentUuid"
          @select="handleSelect"
        />

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
            class="btn-primary"
            :disabled="!selected"
            @click="handleConfirm"
          >
            Confirmer
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
  color: var(--color-info-500);
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

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
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

.btn-primary {
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background-color: var(--color-info-500);
  color: var(--color-surface);
  border: none;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-info-600);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
