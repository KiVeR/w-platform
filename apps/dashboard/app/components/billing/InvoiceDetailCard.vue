<script setup lang="ts">
import type { Invoice } from '@/composables/useInvoices'

defineProps<{
  invoice: Invoice
}>()

const { t } = useI18n()
</script>

<template>
  <div class="rounded-lg border bg-card p-6 space-y-4">
    <h2 class="text-xl font-semibold">{{ invoice.ref_invoice }}</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <p class="text-sm text-muted-foreground">{{ t('billing.columns.invoice_date') }}</p>
        <p class="font-medium">{{ invoice.invoice_date }}</p>
      </div>
      <div>
        <p class="text-sm text-muted-foreground">{{ t('billing.columns.total_ttc') }}</p>
        <p class="font-medium">{{ invoice.amount_ttc?.toFixed(2) }} &euro;</p>
      </div>
      <div>
        <p class="text-sm text-muted-foreground">{{ t('billing.columns.status') }}</p>
        <p class="font-medium">{{ invoice.status }}</p>
      </div>
    </div>
  </div>
</template>
