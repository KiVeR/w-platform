<script setup lang="ts">
import type { CampaignRoutingStatus } from '@/types/campaign'

const props = defineProps<{
  status: CampaignRoutingStatus
}>()

const { t } = useI18n()

const STATUS_MAP: Record<CampaignRoutingStatus, { bg: string, text: string, border: string }> = {
  QUERY_PENDING:                { bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-warning-500/30' },
  QUERY_IN_PROGRESS:            { bg: 'bg-info-100',    text: 'text-info-700',    border: 'border-info-500/30' },
  QUERY_FAILED:                 { bg: 'bg-error-100',   text: 'text-error-700',   border: 'border-error-500/30' },
  SHORT_URL_ERROR:              { bg: 'bg-error-100',   text: 'text-error-700',   border: 'border-error-500/30' },
  SHORT_URL_SUFFIX_PENDING:     { bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-warning-500/30' },
  SHORT_URL_SUFFIX_REQUESTED:   { bg: 'bg-info-100',    text: 'text-info-700',    border: 'border-info-500/30' },
  SHORT_URL_SUFFIX_FAILED:      { bg: 'bg-error-100',   text: 'text-error-700',   border: 'border-error-500/30' },
  MESSAGE_GENERATION_PENDING:   { bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-warning-500/30' },
  MESSAGE_GENERATION_REQUESTED: { bg: 'bg-info-100',    text: 'text-info-700',    border: 'border-info-500/30' },
  MESSAGE_GENERATION_FAILED:    { bg: 'bg-error-100',   text: 'text-error-700',   border: 'border-error-500/30' },
  ROUTING_PENDING:              { bg: 'bg-info-100',    text: 'text-info-700',    border: 'border-info-500/30' },
  ROUTING_IN_PROGRESS:          { bg: 'bg-info-100',    text: 'text-info-700',    border: 'border-info-500/30' },
  ROUTING_COMPLETED:            { bg: 'bg-success-100', text: 'text-success-700', border: 'border-success-500/30' },
  ROUTING_PAUSED:               { bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-warning-500/30' },
  ROUTING_FAILED:               { bg: 'bg-error-100',   text: 'text-error-700',   border: 'border-error-500/30' },
  ROUTING_CANCELED:             { bg: 'bg-zinc-200',    text: 'text-zinc-700',    border: 'border-zinc-400' },
}

const config = computed(() => STATUS_MAP[props.status])
</script>

<template>
  <span
    :class="[config.bg, config.text, config.border, 'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold']"
  >
    <slot>{{ t(`campaigns.routingStatus.${status}`) }}</slot>
  </span>
</template>
