<script setup lang="ts">
definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['view operations'],
})

const { t } = useI18n()

const { invoices, isLoading, hasError, fetchInvoices } = useInvoices()
const { balance, isLoading: isLoadingBalance, fetchBalance } = usePartnerBalance()

const pendingCount = ref(0)
const isLoadingQueue = ref(false)

onMounted(async () => {
  await fetchInvoices()
  // Balance and queue loading are best-effort
  try {
    // Partner balance requires a partner context — use partner store if available
    const partnerStore = useNuxtApp().$pinia?.state?.value?.partner
    if (partnerStore?.current?.id) {
      await fetchBalance(partnerStore.current.id)
    }
  }
  catch {
    // non-critical
  }
})

function onSelectInvoice(id: number) {
  navigateTo('/billing/' + id)
}
</script>

<template>
  <div class="space-y-6 p-6">
    <h1 class="text-2xl font-bold">
      {{ t('billing.title') }}
    </h1>

    <!-- Top cards row -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <PartnerBalanceCard
        :euro-credits="balance?.euro_credits ?? 0"
        :is-loading="isLoadingBalance"
      />
      <BillingQueueCard
        :pending-count="pendingCount"
        :is-loading="isLoadingQueue"
      />
    </div>

    <!-- Error state -->
    <div v-if="hasError" class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400" data-testid="error-state">
      {{ t('billing.error') }}
    </div>

    <!-- Invoices table -->
    <InvoicesDataTable
      :invoices="invoices"
      :is-loading="isLoading"
      @select="onSelectInvoice"
    />
  </div>
</template>
