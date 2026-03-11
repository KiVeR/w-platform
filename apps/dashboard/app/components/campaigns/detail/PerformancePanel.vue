<script setup lang="ts">
import { computed } from 'vue'
import { MousePointerClick, OctagonMinus, ShieldCheck } from 'lucide-vue-next'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { CampaignStats, CampaignStatus } from '@/types/campaign'
import { formatNumber } from '@/utils/format'

const props = withDefaults(defineProps<{
  campaignStatus: CampaignStatus
  stats?: CampaignStats | null
  isLoading?: boolean
}>(), {
  stats: null,
  isLoading: false,
})

const { t } = useI18n()

const isVisible = computed(() => props.campaignStatus === 'sent')

function formatPercent(value: number | undefined): string {
  return `${((value ?? 0) * 100).toFixed(1)} %`
}

const secondaryMetrics = computed(() => [
  {
    key: 'delivered',
    label: t('campaigns.detail.stats.delivered'),
    value: formatNumber(props.stats?.delivered ?? 0),
    icon: ShieldCheck,
  },
  {
    key: 'clicks',
    label: t('campaigns.detail.stats.clicks'),
    value: formatNumber(props.stats?.clicks ?? 0),
    icon: MousePointerClick,
  },
  {
    key: 'stop',
    label: t('campaigns.detail.stats.stop'),
    value: formatNumber(props.stats?.stop ?? 0),
    icon: OctagonMinus,
  },
])
</script>

<template>
  <Card
    v-if="isVisible"
    data-performance-panel
    class="gap-4"
  >
    <CardHeader class="pb-0">
      <CardTitle class="text-base">
        {{ t('campaigns.detail.stats.title') }}
      </CardTitle>
    </CardHeader>

    <CardContent class="space-y-4">
      <div
        v-if="isLoading"
        data-performance-loading
        class="space-y-4"
      >
        <div class="grid grid-cols-2 gap-3">
          <Skeleton v-for="i in 2" :key="i" class="h-24 rounded-xl" />
        </div>
        <Skeleton class="h-20 rounded-xl" />
      </div>

      <template v-else>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-success-500/20 bg-success-50/60 p-4">
            <p class="text-xs font-medium uppercase tracking-[0.16em] text-success-700">
              {{ t('campaigns.detail.stats.deliverabilityRate') }}
            </p>
            <p class="mt-3 text-3xl font-bold tabular-nums text-success-700" data-performance-deliverability>
              {{ formatPercent(stats?.deliverability_rate) }}
            </p>
          </div>

          <div class="rounded-xl border border-primary/15 bg-primary/5 p-4">
            <p class="text-xs font-medium uppercase tracking-[0.16em] text-primary">
              {{ t('campaigns.detail.stats.ctr') }}
            </p>
            <p class="mt-3 text-3xl font-bold tabular-nums text-primary" data-performance-ctr>
              {{ formatPercent(stats?.ctr) }}
            </p>
          </div>
        </div>

        <div class="grid gap-3">
          <div
            v-for="metric in secondaryMetrics"
            :key="metric.key"
            :data-metric="metric.key"
            class="flex items-center justify-between rounded-xl border border-border/70 bg-muted/35 px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <component
                :is="metric.icon"
                class="size-4 text-muted-foreground"
                :stroke-width="1.75"
              />
              <span class="text-sm text-muted-foreground">{{ metric.label }}</span>
            </div>

            <span class="text-sm font-semibold tabular-nums text-foreground">
              {{ metric.value }}
            </span>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
