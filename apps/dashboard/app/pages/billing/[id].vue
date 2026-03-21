<script setup lang="ts">
definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['view operations'],
})

const { t } = useI18n()
const route = useRoute()

const { invoice, isLoading, hasError, fetchInvoice } = useInvoiceDetail()

onMounted(async () => {
  const id = Number(route.params.id)
  await fetchInvoice(id)
})

function goBack() {
  navigateTo('/billing')
}
</script>

<template>
  <div class="p-6">
    <!-- Back link -->
    <button class="mb-4 text-sm text-muted-foreground hover:text-foreground" data-testid="back-link" @click="goBack">
      &larr; {{ t('billing.back_to_list') }}
    </button>

    <!-- Loading -->
    <div v-if="isLoading" class="py-12 text-center text-muted-foreground" data-testid="loading-state">
      {{ t('billing.detail_loading') }}
    </div>

    <!-- Error -->
    <div v-else-if="hasError" class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400" data-testid="error-state">
      {{ t('billing.error') }}
    </div>

    <!-- Invoice detail -->
    <InvoiceDetailCard v-else-if="invoice" :invoice="invoice" />
  </div>
</template>
