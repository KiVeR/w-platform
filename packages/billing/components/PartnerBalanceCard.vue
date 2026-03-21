<script setup lang="ts">
const props = defineProps<{
  euroCredits: number
  isLoading: boolean
}>()

const { t } = useI18n()

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}
</script>

<template>
  <div class="rounded-lg border p-4" data-testid="partner-balance-card">
    <p class="text-sm font-medium text-muted-foreground">{{ t('billing.balance.title') }}</p>
    <div v-if="isLoading" class="mt-2 text-muted-foreground" data-testid="balance-loading">
      {{ t('billing.balance.loading') }}
    </div>
    <div v-else class="mt-2">
      <p class="text-2xl font-bold" :class="euroCredits <= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'" data-testid="balance-amount">
        {{ formatCurrency(euroCredits) }}
      </p>
    </div>
  </div>
</template>
