<script setup lang="ts">
const props = defineProps<{
  pendingCount: number
  isLoading: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <div class="rounded-lg border p-4" data-testid="billing-queue-card">
    <p class="text-sm font-medium text-muted-foreground">{{ t('billing.queue.title') }}</p>
    <div v-if="isLoading" class="mt-2 text-muted-foreground" data-testid="queue-loading">
      {{ t('billing.queue.loading') }}
    </div>
    <div v-else class="mt-2">
      <p class="text-2xl font-bold" data-testid="queue-count">
        {{ pendingCount }}
      </p>
      <p class="text-xs text-muted-foreground">
        {{ t('billing.queue.description') }}
      </p>
    </div>
  </div>
</template>
