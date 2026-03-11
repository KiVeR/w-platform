<script setup lang="ts">
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useCampaignStats } from '@/composables/useCampaignStats'
import { formatNumber, formatDateTime } from '@/utils/format'
import { AlertTriangle, Clock, ServerCrash } from 'lucide-vue-next'

const props = defineProps<{
  campaignId: number
}>()

const { t } = useI18n()
const {
  stats,
  isLoading,
  errorType,
  availableAt,
  fetchStats,
} = useCampaignStats(() => props.campaignId)

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)} %`
}

onMounted(() => fetchStats())
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-base">{{ t('campaigns.detail.stats.title') }}</CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="isLoading" class="space-y-4" data-stats-loading>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Skeleton v-for="i in 4" :key="i" class="h-16 rounded-lg" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <Skeleton v-for="i in 2" :key="i" class="h-12 rounded-lg" />
        </div>
      </div>

      <Alert v-else-if="errorType === 'not_yet'" variant="info" data-stats-not-yet>
        <Clock class="size-4" />
        <AlertDescription>
          <template v-if="availableAt">
            {{ t('campaigns.detail.stats.notYet', { date: formatDateTime(availableAt) }) }}
          </template>
          <template v-else>
            {{ t('campaigns.detail.stats.notYetNoDate') }}
          </template>
        </AlertDescription>
      </Alert>

      <Alert v-else-if="errorType === 'only_sent'" variant="warning" data-stats-only-sent>
        <AlertTriangle class="size-4" />
        <AlertDescription>{{ t('campaigns.detail.stats.onlySent') }}</AlertDescription>
      </Alert>

      <Alert v-else-if="errorType === 'provider'" variant="destructive" data-stats-provider-error>
        <ServerCrash class="size-4" />
        <AlertDescription>{{ t('campaigns.detail.stats.providerError') }}</AlertDescription>
      </Alert>

      <div v-else-if="stats" data-stats-content>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div class="rounded-lg border p-3 text-center">
            <p class="text-2xl font-bold tabular-nums">{{ formatNumber(stats.sent) }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ t('campaigns.detail.stats.sent') }}</p>
          </div>
          <div class="rounded-lg border p-3 text-center">
            <p class="text-2xl font-bold tabular-nums text-success-600">{{ formatNumber(stats.delivered) }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ t('campaigns.detail.stats.delivered') }}</p>
          </div>
          <div class="rounded-lg border p-3 text-center">
            <p class="text-2xl font-bold tabular-nums text-primary">{{ formatNumber(stats.clicks) }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ t('campaigns.detail.stats.clicks') }}</p>
          </div>
          <div class="rounded-lg border p-3 text-center">
            <p class="text-2xl font-bold tabular-nums text-warning-600">{{ formatNumber(stats.stop) }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ t('campaigns.detail.stats.stop') }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-4">
          <div class="rounded-lg border p-3 text-center">
            <p class="text-xl font-bold tabular-nums">{{ formatPercent(stats.deliverability_rate) }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ t('campaigns.detail.stats.deliverabilityRate') }}</p>
          </div>
          <div class="rounded-lg border p-3 text-center">
            <p class="text-xl font-bold tabular-nums">{{ formatPercent(stats.ctr) }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ t('campaigns.detail.stats.ctr') }}</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
