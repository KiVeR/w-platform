<script setup lang="ts">
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed'

const props = defineProps<{
  status: CampaignStatus
}>()

const STATUS_MAP: Record<CampaignStatus, { label: string, bg: string, text: string, border: string }> = {
  draft: { label: 'Brouillon', bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-300' },
  scheduled: { label: 'Planifiée', bg: 'bg-info-100', text: 'text-info-700', border: 'border-info-500/30' },
  sending: { label: 'En cours', bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-warning-500/30' },
  sent: { label: 'Envoyée', bg: 'bg-success-100', text: 'text-success-700', border: 'border-success-500/30' },
  cancelled: { label: 'Annulée', bg: 'bg-zinc-200', text: 'text-zinc-700', border: 'border-zinc-400' },
  failed: { label: 'Échouée', bg: 'bg-error-100', text: 'text-error-700', border: 'border-error-500/30' },
}

const config = computed(() => STATUS_MAP[props.status])
</script>

<template>
  <span
    :class="[config.bg, config.text, config.border, 'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold']"
  >
    <slot>{{ config.label }}</slot>
  </span>
</template>
