<script setup lang="ts">
import { ref } from 'vue'
import type { OperationRow, LifecycleStatus, OperationType } from '#operations/types/operations'
import { OPERATION_TYPE_CONFIG } from '#operations/types/operations'

const props = defineProps<{
  operations: OperationRow[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  select: [id: number]
  'filter-status': [status: LifecycleStatus | undefined]
}>()

const { t, locale } = useI18n()

const activeFilter = ref<string>('all')

function selectFilter(key: string, status?: LifecycleStatus) {
  activeFilter.value = key
  emit('filter-status', status)
}

function getTypeLabel(type: OperationType): string {
  return t(OPERATION_TYPE_CONFIG[type]?.i18nKey ?? 'operations.type.loc')
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Quick filters -->
    <div class="flex gap-2" data-testid="quick-filters">
      <button
        v-for="f in [
          { key: 'all', label: t('operations.filters.all'), status: undefined },
          { key: 'active', label: t('operations.filters.active'), status: 'processing' as LifecycleStatus },
          { key: 'blocked', label: t('operations.filters.blocked'), status: 'on_hold' as LifecycleStatus },
          { key: 'delivered', label: t('operations.filters.delivered'), status: 'delivered' as LifecycleStatus },
        ]"
        :key="f.key"
        class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
        :class="activeFilter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'"
        :data-filter="f.key"
        @click="selectFilter(f.key, f.status)"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="py-12 text-center text-muted-foreground" data-testid="loading">
      {{ t('operations.loading') }}
    </div>

    <!-- Empty state -->
    <div v-else-if="operations.length === 0" class="py-12 text-center text-muted-foreground" data-testid="empty-state">
      {{ t('operations.empty') }}
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-md border">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th class="px-4 py-3 text-left font-medium">{{ t('operations.columns.ref') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('operations.columns.name') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('operations.columns.type') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('operations.columns.status') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('operations.columns.scheduled') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('operations.columns.created') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="op in operations"
            :key="op.id"
            class="cursor-pointer border-b transition-colors hover:bg-muted/50"
            :data-row-id="op.id"
            @click="emit('select', op.id)"
          >
            <td class="px-4 py-3 font-mono text-xs">{{ op.ref_operation }}</td>
            <td class="px-4 py-3">{{ op.name }}</td>
            <td class="px-4 py-3">{{ getTypeLabel(op.type) }}</td>
            <td class="px-4 py-3">
              <OperationStatusBadge :status="op.lifecycle_status" />
            </td>
            <td class="px-4 py-3">{{ formatDate(op.scheduled_at) }}</td>
            <td class="px-4 py-3">{{ formatDate(op.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
