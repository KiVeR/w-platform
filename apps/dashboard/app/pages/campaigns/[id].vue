<script setup lang="ts">
import { ArrowLeft, Download, Copy } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import CampaignStatusBadge from '@/components/shared/CampaignStatusBadge.vue'
import CampaignSummaryCard from '@/components/campaigns/CampaignSummaryCard.vue'
import TargetingSummary from '@/components/campaigns/TargetingSummary.vue'
import CampaignStatsCard from '@/components/campaigns/CampaignStatsCard.vue'
import { useCampaignDetail } from '@/composables/useCampaignDetail'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import { useApi } from '@/composables/useApi'
import type { CampaignTargeting } from '@/types/campaign'

definePageMeta({
  breadcrumbLabel: 'Détail campagne',
})

const route = useRoute()
const { t } = useI18n()
const wizard = useCampaignWizardStore()
const api = useApi()

const campaignId = computed(() => Number(route.params.id))

const {
  campaign,
  isLoading,
  error,
  isExporting,
  fetchCampaign,
  exportCampaign,
} = useCampaignDetail(campaignId)

onMounted(() => fetchCampaign())

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

async function handleDuplicate(): Promise<void> {
  if (!campaign.value) return
  const { data, error: apiError } = await api.GET('/campaigns/{campaign}', {
    params: { path: { campaign: campaign.value.id } },
  } as never)
  if (apiError || !data) return
  const raw = (data as { data: Record<string, unknown> }).data
  wizard.initFromCampaign(raw)
  navigateTo('/campaigns/new')
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="isLoading" class="space-y-6" data-detail-loading>
      <div class="flex items-center gap-4">
        <Skeleton class="h-8 w-8 rounded" />
        <Skeleton class="h-8 w-64" />
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <Skeleton class="h-80 rounded-lg" />
        <Skeleton class="h-80 rounded-lg" />
      </div>
    </div>

    <div v-else-if="error" data-detail-error>
      <Alert variant="destructive">
        <AlertTitle>{{ t('campaigns.detail.loadError') }}</AlertTitle>
        <AlertDescription>{{ t('campaigns.detail.loadErrorDescription') }}</AlertDescription>
      </Alert>
      <div class="mt-4">
        <NuxtLink to="/campaigns">
          <Button variant="outline">
            <ArrowLeft class="mr-2 size-4" />
            {{ t('campaigns.detail.back') }}
          </Button>
        </NuxtLink>
      </div>
    </div>

    <template v-else-if="campaign">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <NuxtLink to="/campaigns">
            <Button variant="ghost" size="icon" class="size-8" data-back-button>
              <ArrowLeft class="size-4" />
            </Button>
          </NuxtLink>
          <h1 class="text-2xl font-semibold tracking-tight" data-campaign-name>
            {{ campaign.name }}
          </h1>
          <CampaignStatusBadge :status="campaign.status" />
        </div>

        <div class="flex items-center gap-2">
          <Button
            v-if="campaign.status === 'sent'"
            variant="outline"
            size="sm"
            :disabled="isExporting"
            data-export-button
            @click="exportCampaign"
          >
            <Download class="mr-2 size-4" />
            {{ t('campaigns.detail.export') }}
          </Button>
          <Button
            v-if="campaign.status !== 'draft'"
            variant="outline"
            size="sm"
            data-duplicate-button
            @click="handleDuplicate"
          >
            <Copy class="mr-2 size-4" />
            {{ t('campaigns.detail.duplicate') }}
          </Button>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="space-y-6">
          <CampaignSummaryCard :campaign="campaign" />
          <TargetingSummary v-if="parsedTargeting" :targeting="parsedTargeting" />
        </div>

        <div v-if="showStats">
          <CampaignStatsCard :campaign-id="campaign.id" />
        </div>
      </div>
    </template>
  </div>
</template>
