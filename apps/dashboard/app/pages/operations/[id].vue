<script setup lang="ts">
definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['view operations'],
})

const route = useRoute()
const { t } = useI18n()

const operationId = Number(route.params.id)

const {
  operation,
  isLoading: isLoadingDetail,
  hasError: hasDetailError,
  fetchOperation,
  refreshOperation,
} = useOperationDetail()

const {
  transitions,
  isLoadingHistory,
  isTransitioning,
  applyTransition,
  fetchTransitionHistory,
} = useOperationTransitions()

async function onTransition(toState: string, reason?: string) {
  const success = await applyTransition(operationId, 'lifecycle', toState, reason)
  if (success) {
    await refreshOperation()
    await fetchTransitionHistory(operationId)
  }
}

onMounted(async () => {
  await fetchOperation(operationId)
  await fetchTransitionHistory(operationId)
})
</script>

<template>
  <div class="p-6">
    <!-- Back link -->
    <button
      class="mb-4 text-sm text-muted-foreground hover:text-foreground"
      @click="navigateTo('/operations')"
    >
      &larr; {{ t('operations.back_to_list') }}
    </button>

    <!-- Loading -->
    <div v-if="isLoadingDetail" class="py-12 text-center text-muted-foreground">
      {{ t('operations.loading') }}
    </div>

    <!-- Error -->
    <div v-else-if="hasDetailError || !operation" class="py-12 text-center text-muted-foreground" data-testid="error-state">
      {{ t('operations.detail.error') }}
    </div>

    <!-- Detail panel -->
    <OperationDetailPanel
      v-else
      :operation="operation"
      :transitions="transitions"
      :is-loading-transitions="isLoadingHistory"
      :is-transitioning="isTransitioning"
      @transition="onTransition"
    />
  </div>
</template>
