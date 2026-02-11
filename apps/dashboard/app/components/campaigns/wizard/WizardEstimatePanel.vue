<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { BarChart3, RefreshCw, AlertCircle, Loader2 } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import { usePartnerStore } from '@/stores/partner'
import { useApi } from '@/composables/useApi'
import { formatCurrency } from '@/utils/format'

const wizard = useCampaignWizardStore()
const partnerStore = usePartnerStore()
const api = useApi()
const { t } = useI18n()

const euroCredits = ref<number | null>(null)
const isCounting = ref(false)

onMounted(async () => {
  const partnerId = partnerStore.effectivePartnerId
  if (!partnerId) return
  const { data, error } = await api.GET('/partners/{partner}', {
    params: { path: { partner: partnerId } },
  } as never)
  if (!error && data) {
    const raw = (data as { data: { euro_credits: string } }).data
    euroCredits.value = Number(raw.euro_credits)
  }
})

const insufficientCredits = computed(() => {
  if (!wizard.estimate || euroCredits.value === null) return false
  return wizard.estimate.totalPrice > euroCredits.value
})

async function handleCount() {
  isCounting.value = true
  try { await wizard.requestEstimate() }
  finally { isCounting.value = false }
}
</script>

<template>
  <Card>
    <CardHeader class="flex-row items-center justify-between space-y-0 pb-3">
      <div class="flex items-center gap-2">
        <BarChart3 class="size-4 text-primary" />
        <CardTitle class="text-sm">{{ t('wizard.estimate.title') }}</CardTitle>
      </div>
      <Button
        v-if="wizard.estimate"
        variant="ghost"
        size="sm"
        :disabled="isCounting"
        data-recalculate-button
        @click="handleCount"
      >
        <RefreshCw class="size-3" :class="isCounting ? 'animate-spin' : ''" />
      </Button>
    </CardHeader>
    <CardContent class="space-y-3">
      <!-- Loading state -->
      <div v-if="isCounting && !wizard.estimate" class="flex flex-col items-center gap-3 py-6 text-center" data-counting-state>
        <Loader2 class="size-6 animate-spin text-primary" />
        <p class="text-sm text-muted-foreground">{{ t('wizard.estimate.calculating') }}</p>
      </div>

      <!-- Results -->
      <template v-else-if="wizard.estimate">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ t('wizard.estimate.type') }}</span>
          <span class="font-medium">{{ t(`campaigns.type.${wizard.campaign.type}`) }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ t('wizard.estimate.volume') }}</span>
          <span class="font-medium" data-volume>{{ wizard.estimate.volume.toLocaleString('fr-FR') }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ t('wizard.estimate.smsCount') }}</span>
          <span class="font-medium" data-sms-count>{{ wizard.estimate.smsCount }}</span>
        </div>
        <Separator />
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ t('wizard.estimate.cost') }}</span>
          <span class="text-lg font-semibold text-primary" data-total-price>{{ formatCurrency(wizard.estimate.totalPrice) }}</span>
        </div>
        <Separator />
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{ t('wizard.estimate.creditsRemaining') }}</span>
          <span
            v-if="euroCredits !== null"
            class="font-medium"
            :class="insufficientCredits ? 'text-destructive' : ''"
            data-credits-remaining
          >
            {{ formatCurrency(euroCredits) }}
          </span>
          <Skeleton v-else class="h-4 w-16" />
        </div>
        <Alert v-if="insufficientCredits" variant="destructive" class="mt-2" data-insufficient-alert>
          <AlertCircle class="size-4" />
          <AlertDescription>{{ t('wizard.estimate.insufficientCreditsWarning') }}</AlertDescription>
        </Alert>
      </template>

      <!-- Empty state: Launch counting button -->
      <template v-else>
        <div class="flex flex-col items-center gap-3 py-4 text-center">
          <p class="text-sm text-muted-foreground">{{ t('wizard.estimate.notAvailable') }}</p>
          <Button
            :disabled="!wizard.campaignId"
            data-count-button
            @click="handleCount"
          >
            <BarChart3 class="size-4" />
            {{ t('wizard.estimate.launchCount') }}
          </Button>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
