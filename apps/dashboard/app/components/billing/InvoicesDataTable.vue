<script setup lang="ts">
import type { Invoice } from '@/composables/useInvoices'

defineProps<{
  invoices: Invoice[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  select: [id: number]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="rounded-lg border">
    <!-- Loading -->
    <div v-if="isLoading" class="p-8 text-center text-muted-foreground">
      {{ t('billing.loading') }}
    </div>

    <!-- Empty state -->
    <div v-else-if="invoices.length === 0" class="p-8 text-center text-muted-foreground" data-testid="empty-state">
      {{ t('billing.empty') }}
    </div>

    <!-- Table -->
    <table v-else class="w-full text-sm">
      <thead class="border-b bg-muted/50">
        <tr>
          <th class="px-4 py-3 text-left font-medium">{{ t('billing.columns.invoice_number') }}</th>
          <th class="px-4 py-3 text-left font-medium">{{ t('billing.columns.invoice_date') }}</th>
          <th class="px-4 py-3 text-right font-medium">{{ t('billing.columns.total_ttc') }}</th>
          <th class="px-4 py-3 text-left font-medium">{{ t('billing.columns.status') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="inv in invoices"
          :key="inv.id"
          class="cursor-pointer border-b hover:bg-muted/30"
          @click="emit('select', inv.id)"
        >
          <td class="px-4 py-3">{{ inv.ref_invoice }}</td>
          <td class="px-4 py-3">{{ inv.invoice_date }}</td>
          <td class="px-4 py-3 text-right">{{ inv.amount_ttc?.toFixed(2) }} &euro;</td>
          <td class="px-4 py-3">{{ inv.status }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
