<script setup lang="ts">
import { computed } from 'vue'
import type { DemandeDetail, DemandeOperationRow } from '#demandes/types/demandes'

const props = defineProps<{
  demande: DemandeDetail
}>()

defineEmits<{
  refresh: []
}>()

const { t } = useI18n()

const operations = computed(() =>
  [...(props.demande.operations ?? [])].sort((a, b) => a.line_number - b.line_number)
)
const completedCount = computed(() => props.demande.operations_completed_count)
const totalCount = computed(() => props.demande.operations_count)
</script>

<template>
  <div class="space-y-4" data-testid="demande-detail-hub">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h2 class="text-lg font-semibold">{{ t('demandes.hub.operations_title') }}</h2>
        <span class="text-sm text-muted-foreground" data-testid="total-count">({{ totalCount }})</span>
      </div>
      <div class="text-sm text-muted-foreground" data-testid="progress-counter">
        {{ completedCount }}/{{ totalCount }}
      </div>
    </div>

    <!-- Quick create operation -->
    <div class="flex justify-end">
      <DemandeOperationQuickCreate
        :demande-id="demande.id"
        @created="$emit('refresh')"
      />
    </div>

    <!-- Liste opérations -->
    <div
      v-if="operations.length === 0"
      class="text-center py-8 text-muted-foreground border border-dashed rounded-lg"
      data-testid="empty-state"
    >
      {{ t('demandes.hub.no_operations') }}
    </div>

    <div v-else class="space-y-2" data-testid="operations-list">
      <div
        v-for="op in operations"
        :key="op.id"
        class="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
        :data-testid="`operation-row-${op.id}`"
        @click="$emit('select-operation', op)"
      >
        <div class="flex items-center gap-3">
          <span class="font-mono text-sm" data-testid="op-ref">{{ op.ref_operation }}</span>
          <span class="text-sm" data-testid="op-name">{{ op.name }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-muted" data-testid="op-type">{{ op.type }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="op.priority" class="text-xs" :class="{
            'text-red-500': op.priority === 'high',
            'text-orange-500': op.priority === 'medium',
            'text-gray-400': op.priority === 'low',
          }" data-testid="op-priority">●</span>
          <span
            class="text-xs px-2 py-0.5 rounded-full"
            :class="{
              'bg-green-100 text-green-800': op.lifecycle_status === 'completed',
              'bg-yellow-100 text-yellow-800': op.lifecycle_status === 'on_hold',
              'bg-blue-100 text-blue-800': op.lifecycle_status === 'in_progress',
              'bg-gray-100 text-gray-800': !['completed','on_hold','in_progress'].includes(op.lifecycle_status),
            }"
            data-testid="op-status"
          >
            {{ op.lifecycle_status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
