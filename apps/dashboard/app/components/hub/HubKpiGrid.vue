<script setup lang="ts">
import { Building2, CreditCard, FileText, Link } from 'lucide-vue-next'
import DashboardKpiCard from '@/components/dashboard/DashboardKpiCard.vue'
import { formatNumber, formatCurrency } from '@/utils/format'
import type { HubStats } from '@/types/hub'

const props = defineProps<{
  stats: HubStats | null
  loading?: boolean
}>()

const { t } = useI18n()

const cards = computed(() => [
  {
    key: 'partners',
    label: t('hub.kpis.partners.label'),
    value: props.stats
      ? `${formatNumber(props.stats.activePartnersCount)} / ${formatNumber(props.stats.partnersCount)}`
      : '0 / 0',
    subtitle: t('hub.kpis.partners.subtitle'),
    icon: Building2,
    tone: 'primary' as const,
  },
  {
    key: 'credits',
    label: t('hub.kpis.credits.label'),
    value: formatCurrency(props.stats?.totalCredits ?? 0),
    subtitle: t('hub.kpis.credits.subtitle'),
    icon: CreditCard,
    tone: 'success' as const,
  },
  {
    key: 'demandes',
    label: t('hub.kpis.demandes.label'),
    value: formatNumber(props.stats?.totalDemandes ?? 0),
    subtitle: t('hub.kpis.demandes.subtitle'),
    icon: FileText,
    tone: 'info' as const,
  },
  ...(props.stats?.shortUrlsCount !== null && props.stats?.shortUrlsCount !== undefined ? [{
    key: 'shortUrls',
    label: t('hub.kpis.shortUrls.label'),
    value: `${formatNumber(props.stats.activeShortUrlsCount ?? 0)} / ${formatNumber(props.stats.shortUrlsCount)}`,
    subtitle: t('hub.kpis.shortUrls.subtitle'),
    icon: Link,
    tone: 'default' as const,
  }] : []),
])
</script>

<template>
  <div
    data-hub-kpi-grid
    :class="['grid gap-4 md:grid-cols-2', cards.length > 3 ? 'xl:grid-cols-4' : 'xl:grid-cols-3']"
  >
    <DashboardKpiCard
      v-for="card in cards"
      :key="card.key"
      :label="card.label"
      :value="card.value"
      :subtitle="card.subtitle"
      :icon="card.icon"
      :tone="card.tone"
      :loading="loading"
    />
  </div>
</template>
