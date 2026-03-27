<script setup lang="ts">
defineProps<{
  euroCredits: number
  isLoading: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <div class="rounded-lg border bg-card p-4">
    <p class="text-sm text-muted-foreground">{{ t('billing.balance.title') }}</p>
    <div v-if="isLoading" class="mt-1 h-8 w-24 animate-pulse rounded bg-muted" />
    <p v-else class="mt-1 text-2xl font-bold">
      {{ euroCredits.toFixed(2) }} &euro;
    </p>
  </div>
</template>
