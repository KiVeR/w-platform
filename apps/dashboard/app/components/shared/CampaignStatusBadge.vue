<script setup lang="ts">
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed'

const props = defineProps<{
  status: CampaignStatus
}>()

const { t } = useI18n()

const STATUS_MAP: Record<CampaignStatus, { bg: string, text: string, border: string }> = {
  draft: { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-300' },
  scheduled: { bg: 'bg-info-100', text: 'text-info-700', border: 'border-info-500/30' },
  sending: { bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-warning-500/30' },
  sent: { bg: 'bg-success-100', text: 'text-success-700', border: 'border-success-500/30' },
  cancelled: { bg: 'bg-zinc-200', text: 'text-zinc-700', border: 'border-zinc-400' },
  failed: { bg: 'bg-error-100', text: 'text-error-700', border: 'border-error-500/30' },
}

const config = computed(() => STATUS_MAP[props.status])
</script>

<template>
  <span
    :class="[config.bg, config.text, config.border, 'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold']"
  >
    <slot>{{ t(`campaigns.status.${status}`) }}</slot>
  </span>
</template>
