<script setup lang="ts">
import type { SaveStatus as BaseSaveStatus } from '@/composables/useAutoSave'
import { Check, Cloud, CloudOff, Loader2, Plus } from 'lucide-vue-next'
import { computed } from 'vue'

export type UnifiedStatus = 'idle' | 'dirty' | 'pending' | 'saving' | 'saved' | 'error' | 'first-save'

const props = defineProps<{
  status: BaseSaveStatus
  isDirty: boolean
  needsFirstSave: boolean
  lastSyncedAt: Date | null
  lastError?: string | null
}>()

const emit = defineEmits<{
  save: []
  retry: []
  create: []
}>()

const unifiedStatus = computed<UnifiedStatus>(() => {
  if (props.needsFirstSave && props.isDirty)
    return 'first-save'
  if (props.status === 'saving')
    return 'saving'
  if (props.status === 'saved')
    return 'saved'
  if (props.status === 'error')
    return 'error'
  if (props.status === 'pending')
    return 'pending'
  if (props.isDirty)
    return 'dirty'
  return 'idle'
})

const statusConfig = computed(() => {
  switch (unifiedStatus.value) {
    case 'first-save':
      return {
        icon: Plus,
        text: 'Sauvegarder',
        showText: true,
        tooltip: 'Cliquez pour donner un nom et sauvegarder votre page',
      }
    case 'dirty':
      return {
        icon: Cloud,
        text: null,
        showText: false,
        tooltip: 'Modifications non sauvegardées. Cliquez pour sauvegarder.',
      }
    case 'pending':
      return {
        icon: Cloud,
        text: null,
        showText: false,
        tooltip: 'Sauvegarde automatique dans quelques secondes...',
      }
    case 'saving':
      return {
        icon: Loader2,
        text: null,
        showText: false,
        tooltip: 'Sauvegarde en cours...',
      }
    case 'saved':
      return {
        icon: Check,
        text: null,
        showText: false,
        tooltip: `Dernière sauvegarde : ${formatTime(props.lastSyncedAt)}`,
      }
    case 'error':
      return {
        icon: CloudOff,
        text: 'Erreur',
        showText: true,
        tooltip: props.lastError || 'La sauvegarde a échoué. Cliquez pour réessayer.',
      }
    default:
      return {
        icon: Cloud,
        text: null,
        showText: false,
        tooltip: 'Toutes les modifications sont sauvegardées',
      }
  }
})

const isClickable = computed(() => {
  return ['dirty', 'pending', 'error', 'first-save'].includes(unifiedStatus.value)
})

function formatTime(date: Date | null): string {
  if (!date)
    return '--:--'
  return new Intl.DateTimeFormat('fr-FR', {
    timeStyle: 'short',
  }).format(date)
}

function handleClick() {
  if (!isClickable.value)
    return

  switch (unifiedStatus.value) {
    case 'first-save':
      emit('create')
      break
    case 'error':
      emit('retry')
      break
    case 'dirty':
    case 'pending':
      emit('save')
      break
  }
}
</script>

<template>
  <button
    type="button"
    class="save-status"
    :class="[unifiedStatus, { clickable: isClickable }]"
    :disabled="unifiedStatus === 'saving'"
    :title="statusConfig.tooltip"
    :aria-label="statusConfig.tooltip"
    :aria-busy="unifiedStatus === 'saving'"
    @click="handleClick"
  >
    <span class="icon-wrapper">
      <component
        :is="statusConfig.icon"
        :size="16"
        class="status-icon"
        :class="{
          spinning: unifiedStatus === 'saving',
          pulse: unifiedStatus === 'pending',
        }"
      />
      <span
        v-if="unifiedStatus === 'dirty' || unifiedStatus === 'pending'"
        class="dirty-dot"
        :class="{ pulse: unifiedStatus === 'pending' }"
      />
    </span>
    <span v-if="statusConfig.showText" class="status-text">
      {{ statusConfig.text }}
    </span>
  </button>
</template>

<style scoped>
.save-status {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  min-width: 44px;
  max-width: 160px;
  padding: 0 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: default;
  transition: all 0.2s ease;
  position: relative;
}

.save-status.clickable {
  cursor: pointer;
}

.save-status:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.save-status:disabled {
  cursor: not-allowed;
}

/* Icon wrapper for positioning the dot */
.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dirty-dot {
  position: absolute;
  top: -2px;
  right: -4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

/* States */
.save-status.idle {
  background-color: #f1f5f9;
  color: #64748b;
}

.save-status.dirty {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.save-status.dirty:hover {
  background-color: #bfdbfe;
}

.save-status.pending {
  background-color: #fef3c7;
  color: #b45309;
}

.save-status.pending:hover {
  background-color: #fde68a;
}

.save-status.saving {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.save-status.saved {
  background-color: #dcfce7;
  color: #15803d;
}

.save-status.error {
  background-color: #fee2e2;
  color: #b91c1c;
  animation: shake 0.3s ease-in-out;
}

.save-status.error:hover {
  background-color: #fecaca;
}

.save-status.first-save {
  background-color: var(--color-primary);
  color: white;
}

.save-status.first-save:hover {
  background-color: var(--color-primary-600);
}

/* Animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.spinning {
  animation: spin 1s linear infinite;
}

.pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

.status-text {
  white-space: nowrap;
}
</style>
