<script setup lang="ts">
import type { InvoiceRow, InvoiceStatus } from '#billing/types/billing'
import { isOverdue } from '#billing/types/billing'

defineProps<{
  invoices: InvoiceRow[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  select: [id: number]
  'filter-status': [status: InvoiceStatus | undefined]
}>()

const { t, locale } = useI18n()

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
  <div class="space-y-4">
    <!-- Loading state -->
    <div v-if="isLoading" class="py-12 text-center text-muted-foreground" data-testid="loading">
      {{ t('billing.loading') }}
    </div>

    <!-- Empty state -->
    <div v-else-if="invoices.length === 0" class="py-12 text-center text-muted-foreground" data-testid="empty-state">
      {{ t('billing.empty') }}
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-md border">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th class="px-4 py-3 text-left font-medium">{{ t('billing.columns.invoice_number') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('billing.columns.invoice_date') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('billing.columns.due_date') }}</th>
            <th class="px-4 py-3 text-right font-medium">{{ t('billing.columns.subtotal_ht') }}</th>
            <th class="px-4 py-3 text-right font-medium">{{ t('billing.columns.total_ttc') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('billing.columns.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="inv in invoices"
            :key="inv.id"
            class="cursor-pointer border-b transition-colors hover:bg-muted/50"
            :class="{ 'bg-red-50 dark:bg-red-950/20': isOverdue(inv) }"
            :data-row-id="inv.id"
            @click="emit('select', inv.id)"
          >
            <td class="px-4 py-3 font-mono text-xs">{{ inv.invoice_number }}</td>
            <td class="px-4 py-3">{{ formatDate(inv.invoice_date) }}</td>
            <td class="px-4 py-3">{{ formatDate(inv.due_date) }}</td>
            <td class="px-4 py-3 text-right">{{ formatCurrency(inv.subtotal_ht) }}</td>
            <td class="px-4 py-3 text-right font-medium">{{ formatCurrency(inv.total_ttc) }}</td>
            <td class="px-4 py-3">
              <InvoiceStatusBadge :invoice="inv" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
