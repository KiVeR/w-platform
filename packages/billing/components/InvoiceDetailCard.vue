<script setup lang="ts">
import type { InvoiceDetail } from '#billing/types/billing'
import { isOverdue } from '#billing/types/billing'

const props = defineProps<{
  invoice: InvoiceDetail
}>()

const { t, locale } = useI18n()

const overdue = isOverdue(props.invoice)

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'EUR' }).format(amount)
}
</script>

<template>
  <div class="space-y-6" data-testid="invoice-detail">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-xl font-bold">{{ invoice.invoice_number }}</h2>
        <p v-if="invoice.partner" class="text-sm text-muted-foreground">
          {{ invoice.partner.name }}
        </p>
      </div>
      <InvoiceStatusBadge :invoice="invoice" />
    </div>

    <!-- Overdue warning -->
    <div v-if="overdue" class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400" data-testid="overdue-warning">
      {{ t('billing.overdue_warning') }}
    </div>

    <!-- Summary -->
    <div class="grid grid-cols-2 gap-4 rounded-md border p-4 sm:grid-cols-4">
      <div>
        <p class="text-xs text-muted-foreground">{{ t('billing.columns.invoice_date') }}</p>
        <p class="font-medium">{{ formatDate(invoice.invoice_date) }}</p>
      </div>
      <div>
        <p class="text-xs text-muted-foreground">{{ t('billing.columns.due_date') }}</p>
        <p class="font-medium">{{ formatDate(invoice.due_date) }}</p>
      </div>
      <div>
        <p class="text-xs text-muted-foreground">{{ t('billing.columns.subtotal_ht') }}</p>
        <p class="font-medium">{{ formatCurrency(invoice.subtotal_ht) }}</p>
      </div>
      <div>
        <p class="text-xs text-muted-foreground">{{ t('billing.columns.total_ttc') }}</p>
        <p class="text-lg font-bold">{{ formatCurrency(invoice.total_ttc) }}</p>
      </div>
    </div>

    <!-- Notes -->
    <div v-if="invoice.notes" class="rounded-md border p-4">
      <p class="text-xs text-muted-foreground">{{ t('billing.notes') }}</p>
      <p class="mt-1 text-sm">{{ invoice.notes }}</p>
    </div>

    <!-- Lines table -->
    <div v-if="invoice.lines && invoice.lines.length > 0" class="overflow-x-auto rounded-md border">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th class="px-4 py-3 text-left font-medium">{{ t('billing.line.description') }}</th>
            <th class="px-4 py-3 text-right font-medium">{{ t('billing.line.quantity') }}</th>
            <th class="px-4 py-3 text-right font-medium">{{ t('billing.line.unit_price') }}</th>
            <th class="px-4 py-3 text-right font-medium">{{ t('billing.line.total_ht') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in invoice.lines" :key="line.id" class="border-b" :data-line-id="line.id">
            <td class="px-4 py-3">{{ line.description }}</td>
            <td class="px-4 py-3 text-right">{{ line.quantity }}</td>
            <td class="px-4 py-3 text-right">{{ formatCurrency(line.unit_price) }}</td>
            <td class="px-4 py-3 text-right font-medium">{{ formatCurrency(line.total_ht) }}</td>
          </tr>
        </tbody>
        <tfoot class="border-t bg-muted/30">
          <tr>
            <td colspan="3" class="px-4 py-3 text-right font-medium">{{ t('billing.subtotal') }}</td>
            <td class="px-4 py-3 text-right font-bold">{{ formatCurrency(invoice.subtotal_ht) }}</td>
          </tr>
          <tr>
            <td colspan="3" class="px-4 py-2 text-right text-sm text-muted-foreground">
              {{ t('billing.tax') }} ({{ invoice.tax_rate }}%)
            </td>
            <td class="px-4 py-2 text-right text-sm">{{ formatCurrency(invoice.tax_amount) }}</td>
          </tr>
          <tr>
            <td colspan="3" class="px-4 py-3 text-right font-bold">{{ t('billing.total_ttc') }}</td>
            <td class="px-4 py-3 text-right text-lg font-bold">{{ formatCurrency(invoice.total_ttc) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>
