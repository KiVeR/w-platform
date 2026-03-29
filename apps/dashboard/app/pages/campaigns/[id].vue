<script setup lang="ts">
import { ArrowLeft, Copy, Download, Eye, FileDown, MoreHorizontal, Pause, Pencil, Play, StopCircle, XCircle } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import CampaignActionsPanel from '@/components/campaigns/detail/CampaignActionsPanel.vue'
import ContextBar from '@/components/campaigns/detail/ContextBar.vue'
import PerformancePanel from '@/components/campaigns/detail/PerformancePanel.vue'
import SectionLogs from '@/components/campaigns/detail/SectionLogs.vue'
import SectionMessage from '@/components/campaigns/detail/SectionMessage.vue'
import SectionRecipients from '@/components/campaigns/detail/SectionRecipients.vue'
import SectionTargeting from '@/components/campaigns/detail/SectionTargeting.vue'
import SectionTimeline from '@/components/campaigns/detail/SectionTimeline.vue'
import CampaignStatusBadge from '@/components/shared/CampaignStatusBadge.vue'
import RoutingStatusBadge from '@/components/shared/RoutingStatusBadge.vue'
import { useCampaignActions } from '@/composables/useCampaignActions'
import { useCampaignDetail } from '@/composables/useCampaignDetail'
import { useCampaignSync } from '@/composables/useCampaignSync'
import { useCampaignStats } from '@/composables/useCampaignStats'
import { useCollapsibleSections } from '@/composables/useCollapsibleSections'
import { usePermission } from '@/composables/usePermission'
import { useApi } from '@/composables/useApi'
import { formatDateTime } from '@/utils/format'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import type { CampaignTargeting } from '@/types/campaign'

definePageMeta({
  breadcrumbLabel: 'Détail campagne',
})

const route = useRoute()
const { t } = useI18n()
const { scopedRoute } = useScopedNavigation()
const wizard = useCampaignWizardStore()
const api = useApi()
const { can, hasRole } = usePermission()

const campaignId = computed(() => Number(route.params.id))
const isMobile = useMediaQuery('(max-width: 767px)')
const isDesktop = useMediaQuery('(min-width: 1024px)')
const { onCampaignRefresh, onCampaignUpdated } = useCampaignSync()

const {
  campaign,
  isLoading,
  error,
  isExporting,
  fetchCampaign,
  exportCampaign,
} = useCampaignDetail(campaignId)

const {
  isCancelling,
  cancelError,
  cancelCampaign,
  isRoutingActionPending,
  routingActionError,
  startRouting,
  pauseRouting,
  cancelRouting,
  pullReport,
} = useCampaignActions(campaignId)

const {
  stats,
  isLoading: isStatsLoading,
  errorType: statsErrorType,
  availableAt: statsAvailableAt,
  fetchStats,
} = useCampaignStats(campaignId)

const currentStatus = computed(() => campaign.value?.status ?? 'draft')
const { sections } = useCollapsibleSections(currentStatus)

function extractPostcodeCode(p: { code?: string } | string): string {
  if (typeof p === 'string') return p
  return p.code ?? ''
}

function parseTargetingJson(raw: string): CampaignTargeting | null {
  try {
    const parsed = JSON.parse(raw)
    return {
      method: parsed.method ?? 'department',
      departments: parsed.departments ?? parsed.geo?.departments ?? [],
      postcodes: parsed.postcodes ?? parsed.geo?.postcodes?.map(extractPostcodeCode) ?? [],
      communes: parsed.communes ?? [],
      iris_codes: parsed.iris_codes ?? [],
      address: parsed.address ?? parsed.origin?.address ?? null,
      lat: parsed.lat ?? parsed.origin?.lat ?? null,
      lng: parsed.lng ?? parsed.origin?.lng ?? null,
      radius: parsed.radius ?? parsed.origin?.radius ?? null,
      gender: parsed.gender ?? parsed.demographics?.gender ?? null,
      age_min: parsed.age_min ?? parsed.demographics?.age_min ?? null,
      age_max: parsed.age_max ?? parsed.demographics?.age_max ?? null,
    }
  }
  catch {
    return null
  }
}

const parsedTargeting = computed<CampaignTargeting | null>(() => {
  if (!campaign.value?.targeting) return null
  return parseTargetingJson(campaign.value.targeting)
})

const showStats = computed(() => campaign.value?.status === 'sent')
const isAdmin = computed(() => hasRole('admin'))
const canViewRecipients = computed(() => isAdmin.value || can('view campaigns'))
const canManageCampaigns = computed(() => isAdmin.value || can('manage campaigns'))

const availableActions = computed(() => ({
  edit: !!campaign.value && canManageCampaigns.value && campaign.value.status === 'draft',
  duplicate: !!campaign.value && canManageCampaigns.value && campaign.value.status !== 'draft',
  export: !!campaign.value && canManageCampaigns.value && campaign.value.status === 'sent',
  cancel: !!campaign.value && canManageCampaigns.value && campaign.value.status === 'scheduled',
}))

const availableRoutingActions = computed(() => ({
  startRouting: isAdmin.value && !!campaign.value?.routing_status
    && ['ROUTING_PENDING', 'ROUTING_PAUSED'].includes(campaign.value.routing_status),
  pauseRouting: isAdmin.value && campaign.value?.routing_status === 'ROUTING_IN_PROGRESS',
  cancelRouting: isAdmin.value && !!campaign.value?.routing_status
    && !['ROUTING_COMPLETED', 'ROUTING_CANCELED'].includes(campaign.value.routing_status),
  pullReport: isAdmin.value && !!campaign.value?.routing_executed_at,
}))

const statsAlertText = computed(() => {
  switch (statsErrorType.value) {
    case 'not_yet':
      return statsAvailableAt.value
        ? t('campaigns.detail.stats.notYet', { date: formatDateTime(statsAvailableAt.value) })
        : t('campaigns.detail.stats.notYetNoDate')
    case 'only_sent':
      return t('campaigns.detail.stats.onlySent')
    case 'provider':
      return t('campaigns.detail.stats.providerError')
    default:
      return null
  }
})

const statsAlertVariant = computed(() => {
  switch (statsErrorType.value) {
    case 'only_sent':
      return 'warning'
    case 'provider':
      return 'destructive'
    default:
      return 'info'
  }
})

async function handleDuplicate(): Promise<void> {
  if (!campaign.value) return

  const { data, error: apiError } = await api.GET('/campaigns/{campaign}', {
    params: { path: { campaign: campaign.value.id } },
  } as never)

  if (apiError || !data) return

  const raw = (data as { data: Record<string, unknown> }).data
  wizard.initFromCampaign(raw)
  navigateTo(scopedRoute('/campaigns/new'))
}

function handleEdit(): void {
  if (!campaign.value) return
  navigateTo(scopedRoute(`/campaigns/new?draft=${campaign.value.id}`))
}

async function handleCancel(): Promise<void> {
  const cancelled = await cancelCampaign()

  if (cancelled) {
    await fetchCampaign()
  }
}

async function handleStartRouting(): Promise<void> {
  const success = await startRouting()
  if (success) await fetchCampaign()
}

async function handlePauseRouting(): Promise<void> {
  const success = await pauseRouting()
  if (success) await fetchCampaign()
}

async function handleCancelRouting(): Promise<void> {
  const success = await cancelRouting()
  if (success) await fetchCampaign()
}

async function handlePullReport(): Promise<void> {
  const success = await pullReport()
  if (success) await fetchCampaign()
}

watch(campaignId, async () => {
  await fetchCampaign()
}, { immediate: true })

watch(() => [campaign.value?.id, campaign.value?.status] as const, async ([id, status]) => {
  if (!id || status !== 'sent') return
  await fetchStats()
}, { immediate: true })

onCampaignUpdated((updatedId) => {
  if (updatedId === campaignId.value) {
    void fetchCampaign()
  }
})

onCampaignRefresh(() => {
  void fetchCampaign()
})
</script>

<template>
  <div class="space-y-6 pb-24 md:pb-0">
    <div v-if="isLoading" class="space-y-6" data-detail-loading>
      <div class="flex items-center gap-4">
        <Skeleton class="h-8 w-8 rounded" />
        <Skeleton class="h-8 w-64" />
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <div class="space-y-4">
          <Skeleton class="h-28 rounded-xl" />
          <Skeleton class="h-48 rounded-xl" />
          <Skeleton class="h-64 rounded-xl" />
        </div>
        <div class="space-y-4">
          <Skeleton class="h-96 rounded-xl" />
          <Skeleton class="h-48 rounded-xl" />
        </div>
      </div>
    </div>

    <div v-else-if="error" data-detail-error>
      <Alert variant="destructive">
        <AlertTitle>{{ t('campaigns.detail.loadError') }}</AlertTitle>
        <AlertDescription>{{ t('campaigns.detail.loadErrorDescription') }}</AlertDescription>
      </Alert>
      <div class="mt-4">
        <NuxtLink :to="scopedRoute('/campaigns')">
          <Button variant="outline">
            <ArrowLeft class="mr-2 size-4" />
            {{ t('campaigns.detail.back') }}
          </Button>
        </NuxtLink>
      </div>
    </div>

    <template v-else-if="campaign">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <NuxtLink :to="scopedRoute('/campaigns')">
            <Button variant="ghost" size="icon" class="size-8" data-back-button>
              <ArrowLeft class="size-4" />
            </Button>
          </NuxtLink>

          <div class="min-w-0 space-y-1">
            <p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {{ t('campaigns.detail.summary.title') }}
            </p>
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="truncate text-2xl font-semibold tracking-tight" data-campaign-name>
                {{ campaign.name }}
              </h1>
              <CampaignStatusBadge :status="campaign.status" />
              <RoutingStatusBadge v-if="campaign.routing_status" :status="campaign.routing_status" />
            </div>
          </div>
        </div>

        <DropdownMenu v-if="isMobile">
          <DropdownMenuTrigger as-child>
            <Button data-mobile-actions-trigger variant="outline" size="sm">
              <MoreHorizontal class="mr-2 size-4" />
              {{ t('campaigns.detail.moreActions') }}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              v-if="availableActions.edit"
              data-mobile-edit
              @select="handleEdit"
            >
              <Pencil class="mr-2 size-4" />
              {{ t('campaigns.detail.editDraft') }}
            </DropdownMenuItem>

            <DropdownMenuItem
              v-if="availableActions.duplicate"
              data-mobile-duplicate
              @select="handleDuplicate"
            >
              <Copy class="mr-2 size-4" />
              {{ t('campaigns.detail.duplicate') }}
            </DropdownMenuItem>

            <DropdownMenuItem
              v-if="availableActions.export"
              data-mobile-export
              @select="exportCampaign"
            >
              <Download class="mr-2 size-4" />
              {{ t('campaigns.detail.export') }}
            </DropdownMenuItem>

            <DropdownMenuItem
              v-if="availableActions.cancel"
              data-mobile-cancel
              class="text-destructive"
              @select="handleCancel"
            >
              <XCircle class="mr-2 size-4" />
              {{ t('campaigns.detail.cancel') }}
            </DropdownMenuItem>

            <template v-if="availableRoutingActions.startRouting || availableRoutingActions.pauseRouting || availableRoutingActions.cancelRouting || availableRoutingActions.pullReport">
              <DropdownMenuSeparator />
              <DropdownMenuItem v-if="availableRoutingActions.startRouting" data-mobile-start-routing @select="handleStartRouting">
                <Play class="mr-2 size-4" /> {{ t('campaigns.routingActions.start') }}
              </DropdownMenuItem>
              <DropdownMenuItem v-if="availableRoutingActions.pauseRouting" data-mobile-pause-routing @select="handlePauseRouting">
                <Pause class="mr-2 size-4" /> {{ t('campaigns.routingActions.pause') }}
              </DropdownMenuItem>
              <DropdownMenuItem v-if="availableRoutingActions.cancelRouting" data-mobile-cancel-routing class="text-destructive" @select="handleCancelRouting">
                <StopCircle class="mr-2 size-4" /> {{ t('campaigns.routingActions.cancel') }}
              </DropdownMenuItem>
              <DropdownMenuItem v-if="availableRoutingActions.pullReport" data-mobile-pull-report @select="handlePullReport">
                <FileDown class="mr-2 size-4" /> {{ t('campaigns.routingActions.pullReport') }}
              </DropdownMenuItem>
            </template>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ContextBar :campaign="campaign" />

      <div
        v-if="!isDesktop && !isMobile"
        class="grid gap-4"
      >
        <Card class="overflow-hidden border-border/70 shadow-sm">
          <CardHeader class="pb-0">
            <CardTitle class="text-base">{{ t('campaigns.detail.preview') }}</CardTitle>
            <CardDescription>{{ t('campaigns.detail.previewDescription') }}</CardDescription>
          </CardHeader>
          <CardContent class="flex justify-center px-4 pb-6 pt-2">
            <SmsPreview :sender="campaign.sender || ''" :message="campaign.message || ''" />
          </CardContent>
        </Card>
      </div>

      <div data-detail-layout class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <div data-detail-main class="space-y-4">
          <SectionMessage :campaign="campaign" v-model:open="sections.message" />
          <SectionTargeting :targeting="parsedTargeting" v-model:open="sections.targeting" />
          <SectionRecipients
            v-if="canViewRecipients"
            :campaign-id="campaign.id"
            v-model:open="sections.recipients"
          />
          <SectionTimeline :campaign-id="campaign.id" v-model:open="sections.timeline" />
          <SectionLogs
            v-if="isAdmin"
            :campaign-id="campaign.id"
            v-model:open="sections.logs"
          />

          <template v-if="!isDesktop">
            <div v-if="showStats" class="space-y-4">
              <PerformancePanel
                v-if="!statsErrorType || isStatsLoading"
                :campaign-status="campaign.status"
                :stats="stats"
                :is-loading="isStatsLoading"
              />

              <Alert
                v-else
                data-stats-inline-alert
                :variant="statsAlertVariant"
              >
                <AlertTitle>{{ t('campaigns.detail.stats.title') }}</AlertTitle>
                <AlertDescription>{{ statsAlertText }}</AlertDescription>
              </Alert>
            </div>

            <CampaignActionsPanel
              v-if="!isMobile"
              :campaign="campaign"
              :show-edit="availableActions.edit"
              :show-duplicate="availableActions.duplicate"
              :show-export="availableActions.export"
              :show-cancel="availableActions.cancel"
              :show-start-routing="availableRoutingActions.startRouting"
              :show-pause-routing="availableRoutingActions.pauseRouting"
              :show-cancel-routing="availableRoutingActions.cancelRouting"
              :show-pull-report="availableRoutingActions.pullReport"
              :is-exporting="isExporting"
              :is-cancelling="isCancelling"
              :cancel-error="cancelError"
              :is-routing-action-pending="isRoutingActionPending"
              :routing-action-error="routingActionError"
              @edit="handleEdit"
              @duplicate="handleDuplicate"
              @export="exportCampaign"
              @cancel="handleCancel"
              @start-routing="handleStartRouting"
              @pause-routing="handlePauseRouting"
              @cancel-routing="handleCancelRouting"
              @pull-report="handlePullReport"
            />
          </template>
        </div>

        <div
          v-if="isDesktop"
          data-detail-sidebar
          class="space-y-4 xl:sticky xl:top-6 xl:self-start"
        >
          <Card class="overflow-hidden border-border/70 shadow-sm">
            <CardHeader class="pb-0">
              <CardTitle class="text-base">{{ t('campaigns.detail.preview') }}</CardTitle>
              <CardDescription>{{ t('campaigns.detail.previewDescription') }}</CardDescription>
            </CardHeader>
            <CardContent class="flex justify-center px-4 pb-6 pt-2">
              <SmsPreview :sender="campaign.sender || ''" :message="campaign.message || ''" />
            </CardContent>
          </Card>

          <div v-if="showStats" class="space-y-4">
            <PerformancePanel
              v-if="!statsErrorType || isStatsLoading"
              :campaign-status="campaign.status"
              :stats="stats"
              :is-loading="isStatsLoading"
            />

            <Alert
              v-else
              data-stats-inline-alert
              :variant="statsAlertVariant"
            >
              <AlertTitle>{{ t('campaigns.detail.stats.title') }}</AlertTitle>
              <AlertDescription>{{ statsAlertText }}</AlertDescription>
            </Alert>
          </div>

          <CampaignActionsPanel
            :campaign="campaign"
            :show-edit="availableActions.edit"
            :show-duplicate="availableActions.duplicate"
            :show-export="availableActions.export"
            :show-cancel="availableActions.cancel"
            :show-start-routing="availableRoutingActions.startRouting"
            :show-pause-routing="availableRoutingActions.pauseRouting"
            :show-cancel-routing="availableRoutingActions.cancelRouting"
            :show-pull-report="availableRoutingActions.pullReport"
            :is-exporting="isExporting"
            :is-cancelling="isCancelling"
            :cancel-error="cancelError"
            :is-routing-action-pending="isRoutingActionPending"
            :routing-action-error="routingActionError"
            @edit="handleEdit"
            @duplicate="handleDuplicate"
            @export="exportCampaign"
            @cancel="handleCancel"
            @start-routing="handleStartRouting"
            @pause-routing="handlePauseRouting"
            @cancel-routing="handleCancelRouting"
            @pull-report="handlePullReport"
          />
        </div>
      </div>

      <div v-if="isMobile" class="fixed inset-x-0 bottom-4 z-20 px-4">
        <Sheet>
          <SheetTrigger as-child>
            <Button data-mobile-preview-trigger class="w-full shadow-lg">
              <Eye class="mr-2 size-4" />
              {{ t('campaigns.detail.preview') }}
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" class="max-h-[90svh] overflow-y-auto rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>{{ t('campaigns.detail.preview') }}</SheetTitle>
              <SheetDescription>{{ t('campaigns.detail.previewDescription') }}</SheetDescription>
            </SheetHeader>

            <div class="mt-6 flex justify-center pb-6">
              <SmsPreview :sender="campaign.sender || ''" :message="campaign.message || ''" />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </template>
  </div>
</template>
