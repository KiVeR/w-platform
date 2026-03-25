<script setup lang="ts">
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PageSkeleton from '@/components/shared/PageSkeleton.vue'
import type { CreditBalance, Transaction } from '@/composables/usePartnerCredits'

defineProps<{
  balance: CreditBalance | null
  transactions: Transaction[]
  isLoadingBalance: boolean
  isLoadingTransactions: boolean
  isAdmin: boolean
}>()

const emit = defineEmits<{
  recharge: []
  refresh: []
}>()

const { t } = useI18n()

function formatCredits(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div data-credit-panel class="space-y-4">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <CardTitle class="flex items-center gap-2">
          <Wallet class="size-5" />
          {{ t('hub.credits.title') }}
        </CardTitle>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            data-refresh-btn
            @click="emit('refresh')"
          >
            <RefreshCw class="size-4" />
          </Button>
          <Button
            v-if="isAdmin"
            size="sm"
            data-recharge-btn
            @click="emit('recharge')"
          >
            <Plus class="mr-1 size-4" />
            {{ t('hub.credits.recharge') }}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <PageSkeleton v-if="isLoadingBalance" variant="cards" />
        <div v-else-if="balance" class="text-center py-4">
          <p class="text-3xl font-bold" data-balance-amount>
            {{ formatCredits(balance.euro_credits) }}
          </p>
          <p class="text-sm text-muted-foreground mt-1">
            {{ t('hub.credits.currentBalance') }}
          </p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>{{ t('hub.credits.history') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <PageSkeleton v-if="isLoadingTransactions" variant="table" />
        <div v-else-if="transactions.length === 0" class="text-center py-6 text-muted-foreground">
          {{ t('hub.credits.noTransactions') }}
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="tx in transactions"
            :key="tx.id"
            data-transaction-row
            class="flex items-center justify-between py-2 border-b last:border-0"
          >
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'rounded-full p-1.5',
                  tx.amount >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                ]"
              >
                <component :is="tx.amount >= 0 ? ArrowDownLeft : ArrowUpRight" class="size-4" />
              </div>
              <div>
                <p class="text-sm font-medium">{{ tx.description }}</p>
                <p class="text-xs text-muted-foreground">{{ formatDate(tx.created_at) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Badge :variant="tx.amount >= 0 ? 'default' : 'destructive'" data-tx-amount>
                {{ tx.amount >= 0 ? '+' : '' }}{{ formatCredits(tx.amount) }}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
