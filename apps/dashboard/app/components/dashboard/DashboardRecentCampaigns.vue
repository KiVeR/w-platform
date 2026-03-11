<script setup lang="ts">
import { ArrowRight, Megaphone } from 'lucide-vue-next'
import CampaignStatusBadge from '@/components/shared/CampaignStatusBadge.vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/utils/format'
import type { CampaignRow } from '@/types/campaign'

const props = defineProps<{
  campaigns: CampaignRow[]
  loading?: boolean
}>()

const { t } = useI18n()

function getDisplayDate(campaign: CampaignRow): string {
  return campaign.sent_at ?? campaign.scheduled_at ?? campaign.created_at
}

function formatRelativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)

  if (days <= 0) return t('dashboard.recent.today')
  if (days === 1) return t('dashboard.recent.yesterday')
  if (days < 7) return t('dashboard.recent.daysAgo', { count: days })

  return formatDate(iso)
}
</script>

<template>
  <Card
    data-dashboard-recent
    class="border-border/80 shadow-sm"
  >
    <CardHeader class="gap-2">
      <div class="flex items-start justify-between gap-4">
        <div>
          <CardTitle>{{ t('dashboard.recent.title') }}</CardTitle>
          <CardDescription>{{ t('dashboard.recent.description') }}</CardDescription>
        </div>

        <Button
          as-child
          variant="ghost"
          size="sm"
          class="shrink-0"
        >
          <NuxtLink to="/campaigns">
            {{ t('dashboard.recent.viewAll') }}
            <ArrowRight class="ml-1 size-4" />
          </NuxtLink>
        </Button>
      </div>
    </CardHeader>

    <CardContent class="space-y-3">
      <template v-if="loading">
        <div
          v-for="index in 5"
          :key="index"
          class="rounded-2xl border border-border/70 p-4"
        >
          <Skeleton class="h-4 w-28" />
          <Skeleton class="mt-3 h-3 w-36" />
        </div>
      </template>

      <div
        v-else-if="campaigns.length === 0"
        data-recent-empty
        class="rounded-2xl border border-dashed border-border/70 bg-muted/25 px-5 py-10 text-center text-sm text-muted-foreground"
      >
        {{ t('dashboard.recent.empty') }}
      </div>

      <NuxtLink
        v-for="campaign in campaigns"
        :key="campaign.id"
        :to="`/campaigns/${campaign.id}`"
        data-recent-item
        class="group flex items-start gap-3 rounded-2xl border border-border/70 bg-card px-4 py-4 transition-colors hover:border-primary/30 hover:bg-primary/3"
      >
        <div class="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Megaphone class="size-4" />
        </div>

        <div class="min-w-0 flex-1 space-y-2">
          <div class="flex items-start justify-between gap-3">
            <p class="truncate text-sm font-semibold text-foreground">
              {{ campaign.name }}
            </p>
            <ArrowRight class="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <CampaignStatusBadge :status="campaign.status" />
            <span class="text-xs text-muted-foreground">
              {{ formatRelativeDate(getDisplayDate(campaign)) }}
            </span>
          </div>
        </div>
      </NuxtLink>
    </CardContent>
  </Card>
</template>
