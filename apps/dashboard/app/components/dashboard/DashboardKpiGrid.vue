<script setup lang="ts">
import { AlertTriangle, CalendarClock, Megaphone, Users } from 'lucide-vue-next'
import DashboardKpiCard from '@/components/dashboard/DashboardKpiCard.vue'
import { formatNumber } from '@/utils/format'
import type { DashboardStatsSummary } from '@/composables/useDashboardStats'

const props = defineProps<{
  stats: DashboardStatsSummary | null
  loading?: boolean
}>()

const { t } = useI18n()

const cards = computed(() => [
  {
    key: 'active',
    label: t('dashboard.kpis.active.label'),
    value: formatNumber(props.stats?.activeCount ?? 0),
    subtitle: t('dashboard.kpis.active.subtitle'),
    icon: Megaphone,
    tone: 'primary' as const,
  },
  {
    key: 'scheduled',
    label: t('dashboard.kpis.scheduled.label'),
    value: formatNumber(props.stats?.scheduledCount ?? 0),
    subtitle: t('dashboard.kpis.scheduled.subtitle'),
    icon: CalendarClock,
    tone: 'info' as const,
  },
  {
    key: 'error',
    label: t('dashboard.kpis.error.label'),
    value: formatNumber(props.stats?.errorCount ?? 0),
    subtitle: t('dashboard.kpis.error.subtitle'),
    icon: AlertTriangle,
    tone: 'error' as const,
  },
  {
    key: 'volume',
    label: t('dashboard.kpis.volume.label'),
    value: formatNumber(props.stats?.totalVolume ?? 0),
    subtitle: t('dashboard.kpis.volume.subtitle'),
    icon: Users,
    tone: 'success' as const,
  },
])
</script>

<template>
  <div
    data-kpi-grid
    class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
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
