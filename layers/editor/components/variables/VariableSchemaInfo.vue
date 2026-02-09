<script setup lang="ts">
import { Braces, Globe, Link, Loader2, RefreshCw, Unlink, User } from 'lucide-vue-next'

defineEmits<{
  attach: []
  change: []
  detach: []
}>()

const store = useVariableSchemaStore()
const contentStore = useContentStore()
const canManageSchema = computed(() => contentStore.id !== null)
</script>

<template>
  <div v-if="store.isLoading" class="schema-info schema-loading">
    <Loader2 :size="14" class="spinner" />
    <span>Chargement du schéma...</span>
  </div>

  <div v-else-if="store.error" class="schema-info schema-error">
    <span class="error-text">{{ store.error }}</span>
  </div>

  <div v-else-if="store.isAvailable" class="schema-info">
    <div class="schema-header">
      <Braces :size="14" />
      <span class="schema-title">Schéma de variables</span>
    </div>

    <div class="schema-stats">
      <div v-if="store.globalVariables.length > 0" class="stat">
        <Globe :size="12" class="stat-icon global" />
        <span>{{ store.globalVariables.length }} globale{{ store.globalVariables.length > 1 ? 's' : '' }}</span>
      </div>
      <div v-if="store.recipientVariables.length > 0" class="stat">
        <User :size="12" class="stat-icon recipient" />
        <span>{{ store.recipientVariables.length }} destinataire{{ store.recipientVariables.length > 1 ? 's' : '' }}</span>
      </div>
    </div>

    <div class="schema-variables">
      <code
        v-for="v in store.allVariables"
        :key="v.name"
        class="var-chip"
        :class="v.type"
        :title="v.description"
      >
        {{ v.name }}
      </code>
    </div>

    <div v-if="canManageSchema" class="schema-actions">
      <button class="action-ghost" @click="$emit('change')">
        <RefreshCw :size="12" />
        Changer
      </button>
      <button class="action-ghost action-danger" @click="$emit('detach')">
        <Unlink :size="12" />
        Détacher
      </button>
    </div>
  </div>

  <div v-else class="schema-info schema-empty">
    <span class="empty-text">Aucun schéma de variables attaché</span>
    <button v-if="canManageSchema" class="attach-btn" @click="$emit('attach')">
      <Link :size="14" />
      Attacher un schéma
    </button>
  </div>
</template>

<style scoped>
.schema-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.schema-loading {
  flex-direction: row;
  align-items: center;
  gap: 6px;
  color: var(--color-text-muted);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.schema-error {
  border-color: var(--color-error-300);
  background: color-mix(in srgb, var(--color-error-500) 5%, var(--color-surface));
}

.error-text {
  color: var(--color-error-600);
}

.schema-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text);
  font-weight: var(--font-semibold);
}

.schema-stats {
  display: flex;
  gap: 12px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
}

.stat-icon.global { color: #16a34a; }
.stat-icon.recipient { color: #2563eb; }

.schema-variables {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.var-chip {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-family: var(--font-mono);
}

.var-chip.global {
  background: #dcfce7;
  color: #166534;
}

.var-chip.recipient {
  background: #dbeafe;
  color: #1e40af;
}

.schema-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: 4px;
}

.action-ghost {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.action-ghost:hover {
  background: var(--color-neutral-100);
  color: var(--color-primary);
}

.action-danger:hover {
  color: var(--color-error-600);
}

.schema-empty {
  align-items: center;
  gap: 12px;
}

.empty-text {
  color: var(--color-text-muted);
}

.attach-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px dashed var(--color-neutral-300);
  border-radius: var(--radius-md);
  background: transparent;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.attach-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 5%, transparent);
}
</style>
