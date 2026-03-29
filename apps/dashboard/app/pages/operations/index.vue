<script setup lang="ts">
import type { LifecycleStatus } from '#operations/types/operations'

definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['view operations'],
})

const { t } = useI18n()
const { scopedRoute } = useScopedNavigation()

const {
  operations,
  pagination,
  isLoading,
  hasError,
  fetchOperations,
  setFilters,
  setPage,
} = useOperations()

function onFilterStatus(status: LifecycleStatus | undefined) {
  setFilters({ lifecycle_status: status })
  fetchOperations()
}

function onSelect(id: number) {
  navigateTo(scopedRoute(`/operations/${id}`))
}

onMounted(() => {
  fetchOperations()
})
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold">
      {{ t('nav.operations') }}
    </h1>

    <div v-if="hasError" class="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700" data-testid="error-state">
      {{ t('operations.error') }}
    </div>

    <div class="mt-6">
      <OperationsDataTable
        :operations="operations"
        :is-loading="isLoading"
        @select="onSelect"
        @filter-status="onFilterStatus"
      />
    </div>

    <!-- Pagination -->
    <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between">
      <p class="text-sm text-muted-foreground">
        {{ t('operations.pagination.total', { count: pagination.total }) }}
      </p>
      <div class="flex gap-2">
        <button
          :disabled="pagination.page <= 1"
          class="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          @click="setPage(pagination.page - 1)"
        >
          {{ t('operations.pagination.prev') }}
        </button>
        <button
          :disabled="pagination.page >= pagination.lastPage"
          class="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          @click="setPage(pagination.page + 1)"
        >
          {{ t('operations.pagination.next') }}
        </button>
      </div>
    </div>
  </div>
</template>
