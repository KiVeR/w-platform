<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import DashboardChart from '@/components/dashboard/DashboardChart.vue'
import DashboardKpiGrid from '@/components/dashboard/DashboardKpiGrid.vue'
import DashboardPeriodSelector from '@/components/dashboard/DashboardPeriodSelector.vue'
import DashboardRecentCampaigns from '@/components/dashboard/DashboardRecentCampaigns.vue'
import { useCampaignSync } from '@/composables/useCampaignSync'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { DashboardPeriod } from '@/composables/useDashboardStats'

const { t } = useI18n()
const auth = useAuthStore()
const {
  stats,
  volumeData,
  activityData,
  recentCampaigns,
  period,
  isLoading,
  isRecentLoading,
  hasError,
  refreshDashboard,
  setPeriod,
} = useDashboardStats()
const { onCampaignCreated, onCampaignRefresh, onCampaignUpdated } = useCampaignSync()

onMounted(() => {
  refreshDashboard()
})

onCampaignCreated(() => {
  void refreshDashboard()
})

onCampaignUpdated(() => {
  void refreshDashboard()
})

onCampaignRefresh(() => {
  void refreshDashboard()
})

async function handlePeriodChange(nextPeriod: DashboardPeriod) {
  await setPeriod(nextPeriod)
}
</script>

<template>
  <div
    data-dashboard-page
    class="space-y-6"
  >
    <section class="relative overflow-hidden rounded-[28px] border border-border/80 bg-card px-6 py-6 shadow-sm sm:px-8">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_color-mix(in_srgb,_var(--primary)_18%,_transparent),_transparent_48%),linear-gradient(135deg,_color-mix(in_srgb,_var(--color-info-500)_12%,_transparent),_transparent_45%)]" />

      <div class="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div class="max-w-2xl space-y-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">
            {{ t('dashboard.live') }}
          </p>
          <div class="space-y-1.5">
            <h1
              data-dashboard-title
              class="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
              {{ t('dashboard.welcome', { firstname: auth.user?.firstname ?? '' }) }}
            </h1>
            <p class="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              {{ t('dashboard.description') }}
            </p>
          </div>
        </div>

        <DashboardPeriodSelector
          :model-value="period"
          :disabled="isLoading"
          @change="handlePeriodChange"
        />
      </div>
    </section>

    <Alert
      v-if="hasError"
      data-dashboard-error
      variant="destructive"
    >
      <AlertTitle>{{ t('dashboard.error.title') }}</AlertTitle>
      <AlertDescription>{{ t('dashboard.error.description') }}</AlertDescription>
    </Alert>

    <DashboardKpiGrid
      :stats="stats"
      :loading="isLoading"
    />

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,1fr)]">
      <DashboardChart
        :volume-data="volumeData"
        :activity-data="activityData"
        :is-loading="isLoading"
      />

      <DashboardRecentCampaigns
        :campaigns="recentCampaigns"
        :loading="isRecentLoading"
      />
    </div>
  </div>
</template>
