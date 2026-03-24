<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { DemandeRow, DemandeOperationRow } from '#demandes/types/demandes'

const emit = defineEmits<{
  select: [demande: DemandeRow]
}>()

const { t } = useI18n()
const { demandes, isLoading, fetchActionableDemandes } = useActionableDemandes()

onMounted(fetchActionableDemandes)

const AGING_THRESHOLD_DAYS = 7

function isRecent(dateStr: string): boolean {
  const diffDays = (Date.now() - new Date(dateStr).getTime()) / 86400000
  return diffDays <= 3
}

function hasStaleOperations(demande: DemandeRow): boolean {
  if (!demande.operations?.length) return false
  const terminalStates = ['completed', 'cancelled']
  return demande.operations.some((op: DemandeOperationRow) => {
    if (!op.last_transitioned_at || terminalStates.includes(op.lifecycle_status)) return false
    return (Date.now() - new Date(op.last_transitioned_at).getTime()) / 86400000 > AGING_THRESHOLD_DAYS
  })
}

const actionRequired = computed(() => {
  const filtered = demandes.value.filter(d =>
    d.operations_blocked_count > 0
    || hasStaleOperations(d)
    || (d.operations_count === 0 && isRecent(d.created_at)),
  )
  return [...filtered].sort((a, b) => b.operations_blocked_count - a.operations_blocked_count)
})

const isEmpty = computed(() => actionRequired.value.length === 0)
</script>

<template>
  <div v-if="!isEmpty && !isLoading" class="rounded-lg border border-orange-300 bg-orange-50 p-4" data-testid="action-zone">
    <h2 class="text-sm font-semibold text-orange-800 mb-3">
      {{ t('demandes.action_zone.title') }} ({{ actionRequired.length }})
    </h2>
    <ul class="space-y-2">
      <li
        v-for="demande in actionRequired"
        :key="demande.id"
        class="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm cursor-pointer hover:bg-orange-100 border border-orange-200"
        :data-testid="`action-item-${demande.id}`"
        @click="emit('select', demande)"
      >
        <div class="flex flex-col gap-0.5">
          <span class="font-medium text-gray-900">{{ demande.ref_demande }}</span>
          <span v-if="demande.partner" class="text-xs text-gray-500">{{ demande.partner.name }}</span>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap justify-end">
          <!-- Badge bloquées (rouge) -->
          <span
            v-if="demande.operations_blocked_count > 0"
            class="inline-flex items-center rounded-full bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5"
            data-testid="badge-blocked"
          >
            {{ t('demandes.action_zone.operations_blocked', { count: demande.operations_blocked_count }) }}
          </span>
          <!-- Badge stale (orange) -->
          <span
            v-if="hasStaleOperations(demande)"
            class="inline-flex items-center rounded-full bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5"
            data-testid="badge-stale"
          >
            {{ t('demandes.action_zone.stale') }}
          </span>
          <!-- Badge aucune opération (bleu) -->
          <span
            v-if="demande.operations_count === 0 && isRecent(demande.created_at)"
            class="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5"
            data-testid="badge-no-ops"
          >
            {{ t('demandes.action_zone.no_operations') }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>
