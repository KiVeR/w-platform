<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatNumber } from '@/utils/format'
import type { DashboardSeries } from '@/composables/useDashboardStats'

const props = defineProps<{
  volumeData: DashboardSeries | null
  activityData: DashboardSeries | null
  isLoading?: boolean
}>()

const { t } = useI18n()

const chartWidth = 820
const chartHeight = 280
const padding = {
  top: 16,
  right: 24,
  bottom: 36,
  left: 20,
}

const labels = computed(() => props.volumeData?.labels ?? props.activityData?.labels ?? [])
const volumes = computed(() => props.volumeData?.values ?? [])
const activities = computed(() => props.activityData?.values ?? [])

const empty = computed(() => !props.isLoading
  && volumes.value.every(value => value === 0)
  && activities.value.every(value => value === 0))

const plotWidth = computed(() => chartWidth - padding.left - padding.right)
const plotHeight = computed(() => chartHeight - padding.top - padding.bottom)
const maxVolume = computed(() => Math.max(...volumes.value, 1))
const maxActivity = computed(() => Math.max(...activities.value, 1))
const xStep = computed(() => {
  if (labels.value.length <= 1) return plotWidth.value / 2
  return plotWidth.value / (labels.value.length - 1)
})
const barWidth = computed(() => {
  const count = Math.max(labels.value.length, 1)
  return Math.max(4, Math.min(18, (plotWidth.value / count) * 0.68))
})
const labelEvery = computed(() => Math.max(1, Math.ceil(labels.value.length / 8)))

const chartPoints = computed(() => labels.value.map((label, index) => {
  const x = labels.value.length === 1
    ? padding.left + (plotWidth.value / 2)
    : padding.left + (index * xStep.value)
  const volume = volumes.value[index] ?? 0
  const activity = activities.value[index] ?? 0
  const barHeight = maxVolume.value === 0 ? 0 : (volume / maxVolume.value) * plotHeight.value
  const lineY = padding.top + plotHeight.value - ((activity / maxActivity.value) * plotHeight.value)

  return {
    label,
    volume,
    activity,
    x,
    barX: x - (barWidth.value / 2),
    barY: padding.top + plotHeight.value - barHeight,
    barHeight,
    lineY,
    showLabel: index % labelEvery.value === 0 || index === labels.value.length - 1,
  }
}))

const linePoints = computed(() => chartPoints.value
  .map(point => `${point.x},${point.lineY}`)
  .join(' '))

const gridLines = computed(() => Array.from({ length: 4 }, (_, index) => {
  const ratio = index / 3
  return padding.top + (plotHeight.value * ratio)
}))
</script>

<template>
  <Card
    data-dashboard-chart
    class="border-border/80 shadow-sm"
  >
    <CardHeader class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <CardTitle>{{ t('dashboard.chart.title') }}</CardTitle>
        <CardDescription>{{ t('dashboard.chart.description') }}</CardDescription>
      </div>

      <div class="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
        <div class="inline-flex items-center gap-2">
          <span class="size-2.5 rounded-full bg-primary" />
          {{ t('dashboard.chart.legendVolume') }}
        </div>
        <div class="inline-flex items-center gap-2">
          <span class="size-2.5 rounded-full bg-info-500" />
          {{ t('dashboard.chart.legendActivity') }}
        </div>
      </div>
    </CardHeader>

    <CardContent>
      <div
        v-if="isLoading"
        data-chart-loading
        class="h-[260px] rounded-2xl border border-dashed border-border/70 bg-muted/40"
      />

      <div
        v-else-if="empty"
        data-chart-empty
        class="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/25 px-6 text-center text-sm text-muted-foreground"
      >
        {{ t('dashboard.chart.empty') }}
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <svg
          data-chart-svg
          class="h-[260px] w-full overflow-visible"
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          preserveAspectRatio="none"
        >
          <line
            v-for="line in gridLines"
            :key="line"
            :x1="padding.left"
            :x2="chartWidth - padding.right"
            :y1="line"
            :y2="line"
            stroke="var(--border)"
            stroke-dasharray="4 6"
          />

          <rect
            v-for="point in chartPoints"
            :key="`${point.label}-bar`"
            :x="point.barX"
            :y="point.barY"
            :width="barWidth"
            :height="point.barHeight"
            rx="6"
            fill="color-mix(in srgb, var(--primary) 22%, transparent)"
            stroke="color-mix(in srgb, var(--primary) 55%, transparent)"
          />

          <polyline
            :points="linePoints"
            fill="none"
            stroke="var(--color-info-500)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="3"
          />

          <circle
            v-for="point in chartPoints"
            :key="`${point.label}-dot`"
            :cx="point.x"
            :cy="point.lineY"
            r="3.5"
            fill="var(--color-info-500)"
            stroke="white"
            stroke-width="2"
          />

          <text
            v-for="point in chartPoints"
            v-show="point.showLabel"
            :key="`${point.label}-label`"
            :x="point.x"
            :y="chartHeight - 8"
            text-anchor="middle"
            font-size="11"
            fill="var(--muted-foreground)"
          >
            {{ point.label }}
          </text>
        </svg>

        <div class="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <p>{{ t('dashboard.chart.legendVolume') }}: {{ formatNumber(volumes.reduce((total, value) => total + value, 0)) }}</p>
          <p>{{ t('dashboard.chart.legendActivity') }}: {{ formatNumber(activities.reduce((total, value) => total + value, 0)) }}</p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
