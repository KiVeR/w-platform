<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import HubKpiGrid from '@/components/hub/HubKpiGrid.vue'
import HubAlertsList from '@/components/hub/HubAlertsList.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: [],
})

const { t } = useI18n()
const auth = useAuthStore()
const { stats, alerts, isLoading, hasError, fetchDashboard } = useHubDashboard()

onMounted(() => {
  fetchDashboard()
})
</script>

<template>
  <div
    data-hub-dashboard-page
    class="space-y-6"
  >
    <section class="relative overflow-hidden rounded-[28px] border border-border/80 bg-card px-6 py-6 shadow-sm sm:px-8">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_color-mix(in_srgb,_var(--primary)_18%,_transparent),_transparent_48%),linear-gradient(135deg,_color-mix(in_srgb,_var(--color-info-500)_12%,_transparent),_transparent_45%)]" />

      <div class="relative max-w-2xl space-y-3">
        <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">
          {{ t('hub.dashboard.live') }}
        </p>
        <div class="space-y-1.5">
          <h1
            data-hub-dashboard-title
            class="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            {{ t('hub.dashboard.welcome', { firstname: auth.user?.firstname ?? '' }) }}
          </h1>
          <p class="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            {{ t('hub.dashboard.description') }}
          </p>
        </div>
      </div>
    </section>

    <Alert
      v-if="hasError"
      data-hub-dashboard-error
      variant="destructive"
    >
      <AlertTitle>{{ t('hub.dashboard.error.title') }}</AlertTitle>
      <AlertDescription>{{ t('hub.dashboard.error.description') }}</AlertDescription>
    </Alert>

    <HubKpiGrid
      :stats="stats"
      :loading="isLoading"
    />

    <HubAlertsList
      :alerts="alerts"
      :loading="isLoading"
    />
  </div>
</template>
