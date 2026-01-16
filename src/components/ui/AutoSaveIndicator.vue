<script setup lang="ts">
import type { SaveStatus } from '@/composables/useAutoSave'
import { Check, Cloud, CloudOff, Loader2 } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  status: SaveStatus
  lastSyncedAt: Date | null
}>()

const statusConfig = computed(() => {
  switch (props.status) {
    case 'pending':
      return { icon: Cloud, text: 'En attente...', class: 'pending' }
    case 'saving':
      return { icon: Loader2, text: 'Sauvegarde...', class: 'saving' }
    case 'saved':
      return { icon: Check, text: 'Sauvegardé', class: 'saved' }
    case 'error':
      return { icon: CloudOff, text: 'Erreur', class: 'error' }
    default:
      return { icon: Cloud, text: 'À jour', class: 'idle' }
  }
})

function formatTime(date: Date | null): string {
  if (!date)
    return ''
  return new Intl.DateTimeFormat('fr-FR', {
    timeStyle: 'short',
  }).format(date)
}
</script>

<template>
  <div class="autosave-indicator" :class="statusConfig.class">
    <component
      :is="statusConfig.icon"
      :size="14"
      :class="{ spinning: status === 'saving' }"
    />
    <span class="status-text">{{ statusConfig.text }}</span>
    <span v-if="lastSyncedAt && status === 'idle'" class="sync-time">
      {{ formatTime(lastSyncedAt) }}
    </span>
  </div>
</template>

<style scoped>
.autosave-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  transition: all 0.2s;
}

.autosave-indicator.idle {
  color: #64748b;
  background-color: #f1f5f9;
}

.autosave-indicator.pending {
  color: #f59e0b;
  background-color: #fef3c7;
}

.autosave-indicator.saving {
  color: #3b82f6;
  background-color: #dbeafe;
}

.autosave-indicator.saved {
  color: #22c55e;
  background-color: #dcfce7;
}

.autosave-indicator.error {
  color: #ef4444;
  background-color: #fee2e2;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.status-text {
  font-weight: 500;
}

.sync-time {
  color: #94a3b8;
  font-size: 11px;
}
</style>
