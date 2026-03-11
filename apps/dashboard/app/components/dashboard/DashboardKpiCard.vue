<script setup lang="ts">
import type { Component } from 'vue'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'

type DashboardKpiTone = 'primary' | 'info' | 'success' | 'error'

const props = defineProps<{
  label: string
  value: string
  subtitle: string
  icon: Component
  tone?: DashboardKpiTone
  loading?: boolean
}>()

const toneClass = computed(() => {
  switch (props.tone ?? 'primary') {
    case 'info':
      return {
        border: 'border-info-500/20',
        chip: 'bg-info-100 text-info-700',
        glow: 'from-info-500/18 via-info-500/0 to-transparent',
      }
    case 'success':
      return {
        border: 'border-success-500/20',
        chip: 'bg-success-100 text-success-700',
        glow: 'from-success-500/18 via-success-500/0 to-transparent',
      }
    case 'error':
      return {
        border: 'border-error-500/20',
        chip: 'bg-error-100 text-error-700',
        glow: 'from-error-500/18 via-error-500/0 to-transparent',
      }
    default:
      return {
        border: 'border-primary/20',
        chip: 'bg-primary/10 text-primary',
        glow: 'from-primary/18 via-primary/0 to-transparent',
      }
  }
})
</script>

<template>
  <Card
    data-kpi-card
    class="relative overflow-hidden border shadow-sm"
    :class="toneClass.border"
  >
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br"
      :class="toneClass.glow"
    />

    <CardHeader class="relative flex flex-row items-start justify-between gap-4 pb-3">
      <div class="space-y-1.5">
        <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {{ label }}
        </p>
        <Skeleton
          v-if="loading"
          class="h-8 w-20"
        />
        <p
          v-else
          data-kpi-value
          class="text-3xl font-semibold tracking-tight text-foreground"
        >
          {{ value }}
        </p>
      </div>

      <div
        class="inline-flex size-10 items-center justify-center rounded-2xl"
        :class="toneClass.chip"
      >
        <component :is="icon" class="size-4" />
      </div>
    </CardHeader>

    <CardContent class="relative pt-0">
      <Skeleton
        v-if="loading"
        class="h-4 w-40"
      />
      <p
        v-else
        class="text-sm leading-5 text-muted-foreground"
      >
        {{ subtitle }}
      </p>
    </CardContent>
  </Card>
</template>
