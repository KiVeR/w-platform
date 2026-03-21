<script setup lang="ts">
import type { InvoiceRow } from '#billing/types/billing'
import { INVOICE_STATUS_CONFIG, OVERDUE_CONFIG, isOverdue } from '#billing/types/billing'

const props = defineProps<{
  invoice: InvoiceRow
}>()

const { t } = useI18n()

const overdue = isOverdue(props.invoice)
const config = overdue ? OVERDUE_CONFIG : INVOICE_STATUS_CONFIG[props.invoice.status]

const colorClasses: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="colorClasses[config.color] ?? colorClasses.gray"
    :data-status="overdue ? 'overdue' : invoice.status"
  >
    {{ t(config.i18nKey) }}
  </span>
</template>
