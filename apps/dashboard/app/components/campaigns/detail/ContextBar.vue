<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import type { CampaignDetailEnriched } from '@/types/campaign'
import { formatCurrency, formatDateTime, formatNumber } from '@/utils/format'
import RoutingStatusBadge from '@/components/shared/RoutingStatusBadge.vue'

const props = defineProps<{
  campaign: CampaignDetailEnriched
}>()

const { t } = useI18n()

const dateLabel = computed(() => {
  if (props.campaign.sent_at) return t('campaigns.detail.summary.sentAt')
  if (props.campaign.scheduled_at) return t('campaigns.detail.summary.scheduledAt')
  return t('campaigns.detail.summary.createdAt')
})

const dateValue = computed(() =>
  props.campaign.sent_at ?? props.campaign.scheduled_at ?? props.campaign.created_at,
)

const volumeLabel = computed(() =>
  props.campaign.volume_sent != null
    ? t('campaigns.detail.summary.volumeSent')
    : t('campaigns.detail.summary.volume'),
)

const volumeValue = computed(() => {
  const value = props.campaign.volume_sent ?? props.campaign.volume_estimated
  return value != null ? formatNumber(value) : '—'
})

const priceValue = computed(() =>
  props.campaign.total_price ? formatCurrency(Number(props.campaign.total_price)) : '—',
)

const hasRouting = computed(() => !!props.campaign.router)

const routingDateLabel = computed(() =>
  props.campaign.routing_executed_at
    ? t('campaigns.detail.summary.routingExecuted')
    : t('campaigns.detail.summary.routingPlanned'),
)

const routingDateValue = computed(() =>
  props.campaign.routing_executed_at ?? props.campaign.routing_at ?? null,
)

const gridClasses = computed(() =>
  hasRouting.value
    ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
    : 'sm:grid-cols-2 lg:grid-cols-4',
)
</script>

<template>
  <div
    data-context-bar
    :class="['grid gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm', gridClasses]"
  >
    <div data-context-item="type" class="rounded-lg bg-muted/40 px-3 py-3">
      <p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {{ t('campaigns.detail.summary.type') }}
      </p>
      <div class="mt-2">
        <Badge variant="outline" class="rounded-full">
          {{ t(`campaigns.type.${campaign.type}`) }}
        </Badge>
      </div>
    </div>

    <div data-context-item="volume" class="rounded-lg bg-muted/40 px-3 py-3">
      <p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {{ volumeLabel }}
      </p>
      <p class="mt-2 text-lg font-semibold text-foreground">
        {{ volumeValue }}
      </p>
    </div>

    <div data-context-item="price" class="rounded-lg bg-muted/40 px-3 py-3">
      <p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {{ t('campaigns.detail.summary.totalPrice') }}
      </p>
      <p class="mt-2 text-lg font-semibold text-foreground">
        {{ priceValue }}
      </p>
    </div>

    <div data-context-item="date" class="rounded-lg bg-muted/40 px-3 py-3">
      <p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {{ dateLabel }}
      </p>
      <p class="mt-2 text-lg font-semibold text-foreground">
        {{ formatDateTime(dateValue) }}
      </p>
    </div>

    <div v-if="hasRouting" data-context-item="router" class="rounded-lg bg-muted/40 px-3 py-3">
      <p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {{ t('campaigns.columns.router') }}
      </p>
      <p class="mt-2 text-lg font-semibold text-foreground">
        {{ campaign.router?.name ?? '—' }}
      </p>
    </div>

    <div v-if="hasRouting" data-context-item="routing" class="rounded-lg bg-muted/40 px-3 py-3">
      <p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {{ routingDateLabel }}
      </p>
      <div class="mt-2 flex items-center gap-2">
        <RoutingStatusBadge v-if="campaign.routing_status" :status="campaign.routing_status" />
        <span v-if="routingDateValue" class="text-sm text-muted-foreground">
          {{ formatDateTime(routingDateValue) }}
        </span>
        <span v-else class="text-lg font-semibold text-foreground">—</span>
      </div>
    </div>
  </div>
</template>
