<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { BarChart3, RefreshCw, AlertCircle, Loader2, Check, Circle } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import { usePartnerStore } from '@/stores/partner'
import { useApi } from '@/composables/useApi'
import { formatCurrency } from '@/utils/format'

const props = withDefaults(defineProps<{
  currentStep?: number
}>(), {
  currentStep: 2,
})

const wizard = useCampaignWizardStore()
const partnerStore = usePartnerStore()
const api = useApi()
const { t } = useI18n()

const showChecklist = computed(() => props.currentStep < 2 && !wizard.estimate)

const checklist = computed(() =>
  wizard.STEPS.slice(0, 5).map((step, i) => ({
    labelKey: step.labelKey,
    valid: wizard.stepValidation[i],
    visited: i <= wizard.currentStep,
  })),
)

const hasPricing = computed(() => wizard.estimate?.totalPrice != null)

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
  if (!wizard.estimate || wizard.estimate.totalPrice == null || euroCredits.value === null) return false
  return wizard.estimate.totalPrice > euroCredits.value
})

async function handleCount() {
  isCounting.value = true
  try { await wizard.requestEstimate() }
  finally { isCounting.value = false }
}
</script>

<template>
  <Card class="border-primary/20 bg-primary/3">
    <CardHeader class="flex-row items-center justify-between space-y-0 pb-3">
      <div class="flex items-center gap-2">
        <BarChart3 class="size-4 text-primary" />
        <CardTitle class="text-sm font-semibold text-primary">{{ t('wizard.estimate.title') }}</CardTitle>
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

        <!-- Pricing (only when partner selected) -->
        <template v-if="hasPricing">
          <Separator />
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">{{ t('wizard.estimate.cost') }}</span>
            <span class="text-lg font-semibold text-primary" data-total-price>{{ formatCurrency(wizard.estimate.totalPrice!) }}</span>
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
        <template v-else>
          <Separator />
          <p class="text-xs text-muted-foreground">{{ t('wizard.estimate.selectPartner') }}</p>
        </template>
      </template>

      <!-- Empty state: Checklist or count button -->
      <template v-else>
        <!-- Checklist when on early steps -->
        <div v-if="showChecklist" class="space-y-2" data-estimate-checklist>
          <div
            v-for="(item, i) in checklist"
            :key="i"
            class="flex items-center gap-2 text-xs"
            :data-checklist-item="i"
          >
            <Check v-if="item.valid" class="size-3.5 text-success-500" />
            <Circle v-else class="size-3.5" :class="item.visited ? 'text-muted-foreground' : 'text-muted-foreground/40'" />
            <span :class="item.valid ? 'text-foreground' : 'text-muted-foreground'">
              {{ t(item.labelKey) }}
            </span>
          </div>
        </div>

        <!-- Count button when on targeting+ steps -->
        <div v-else class="flex flex-col items-center gap-3 py-4 text-center">
          <p class="text-sm text-muted-foreground">{{ t('wizard.estimate.notAvailable') }}</p>
          <Button
            :disabled="isCounting"
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
