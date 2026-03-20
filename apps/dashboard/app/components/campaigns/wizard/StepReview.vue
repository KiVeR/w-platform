<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import {
  BarChart3, Megaphone, MessageSquare, MapPin, LayoutTemplate, CalendarIcon,
  Pencil, Send, FlaskConical, CheckCircle2, AlertCircle,
} from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
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

const canLaunch = computed(() =>
  wizard.reviewChecks.messageVerified && wizard.reviewChecks.sendConfirmed && wizard.hasValidTargeting,
)

const scheduleLabel = computed(() => {
  if (wizard.scheduleMode === 'now') return t('wizard.review.sendNow')
  if (!wizard.campaign.scheduled_at) return t('wizard.review.incomplete')
  return new Date(wizard.campaign.scheduled_at).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  })
})

const sections = [
  { key: 'targeting', icon: MapPin, step: 0 },
  { key: 'type', icon: Megaphone, step: 1 },
  { key: 'message', icon: MessageSquare, step: 2 },
  { key: 'landingPage', icon: LayoutTemplate, step: 3 },
  { key: 'schedule', icon: CalendarIcon, step: 4 },
] as const

const targetingBadges = computed(() => {
  const tgt = wizard.campaign.targeting
  if (tgt.method === 'department') return tgt.departments
  if (tgt.method === 'postcode') return tgt.postcodes
  return []
})

const insufficientCredits = computed(() => {
  if (!wizard.estimate || wizard.estimate.totalPrice == null || euroCredits.value === null) return false
  return wizard.estimate.totalPrice > euroCredits.value
})

async function handleLaunch(): Promise<void> {
  const success = wizard.scheduleMode === 'schedule'
    ? await wizard.scheduleCampaign()
    : await wizard.sendCampaign()

  if (success) navigateTo('/campaigns')
}

async function handleTest(): Promise<void> {
  wizard.campaign.is_demo = true
  await wizard.sendCampaign()
}
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold">{{ t('wizard.review.title') }}</h2>

    <div class="space-y-3">
      <Card
        v-for="section in sections"
        :key="section.key"
        :class="!wizard.validateStep(section.step) ? 'border-l-4 border-l-amber-500' : ''"
      >
        <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
          <div class="flex items-center gap-2">
            <CheckCircle2
              v-if="wizard.validateStep(section.step)"
              data-validation-icon
              class="size-4 text-green-500"
            />
            <AlertCircle
              v-else
              data-validation-icon
              class="size-4 text-amber-500"
            />
            <component :is="section.icon" class="size-4 text-muted-foreground" />
            <CardTitle class="text-sm font-medium">
              {{ t(`wizard.review.sections.${section.key}`) }}
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" @click="wizard.goToStep(section.step)">
            <Pencil class="mr-1 size-3" />
            {{ t('wizard.review.edit') }}
          </Button>
        </CardHeader>
        <CardContent>
          <template v-if="section.key === 'type'">
            <Badge variant="secondary">{{ t(`campaigns.type.${wizard.campaign.type}`) }}</Badge>
          </template>

          <template v-else-if="section.key === 'message'">
            <div class="flex items-start gap-4">
              <div data-mini-preview class="w-40 shrink-0 overflow-hidden rounded-lg border bg-white p-2 dark:bg-white" style="transform: scale(0.6); transform-origin: top left; height: 160px;">
                <SmsPreview
                  :sender="wizard.campaign.sender || 'SMS'"
                  :message="wizard.campaign.message"
                />
              </div>
              <div class="space-y-1.5">
                <p class="line-clamp-2 text-sm">{{ wizard.campaign.message || t('wizard.review.incomplete') }}</p>
                <Badge v-if="wizard.campaign.message" variant="secondary" data-sms-count>
                  {{ t('wizard.review.smsCount', { count: getSmsStats(wizard.campaign.message).smsCount }) }}
                </Badge>
              </div>
            </div>
          </template>

          <template v-else-if="section.key === 'targeting'">
            <div v-if="wizard.campaign.targeting.method === 'address' && wizard.campaign.targeting.address" class="flex items-center gap-2">
              <MapPin class="size-4 text-muted-foreground" />
              <span class="text-sm">{{ wizard.campaign.targeting.address }}</span>
              <Badge variant="secondary">
                {{ t('wizard.review.radius', { radius: wizard.campaign.targeting.radius }) }}
              </Badge>
            </div>
            <div v-else-if="targetingBadges.length > 0" class="flex flex-wrap gap-1.5">
              <Badge
                v-for="item in targetingBadges.slice(0, 5)"
                :key="item"
                variant="secondary"
                data-targeting-badge
              >
                {{ item }}
              </Badge>
              <Badge
                v-if="targetingBadges.length > 5"
                variant="outline"
                data-targeting-overflow
              >
                {{ t('wizard.review.otherItems', { count: targetingBadges.length - 5 }) }}
              </Badge>
            </div>
            <span v-else class="text-sm text-muted-foreground">{{ t('wizard.review.incomplete') }}</span>
            <div
              v-if="wizard.campaign.targeting.gender !== null || wizard.campaign.targeting.age_min !== null || wizard.campaign.targeting.age_max !== null"
              data-demographics-info
              class="mt-2 flex flex-wrap gap-1.5"
            >
              <Badge variant="outline">
                {{ wizard.campaign.targeting.gender === 'M' ? t('wizard.targeting.demographics.genderMale')
                  : wizard.campaign.targeting.gender === 'F' ? t('wizard.targeting.demographics.genderFemale')
                    : t('wizard.targeting.demographics.genderMixed') }}
              </Badge>
              <Badge
                v-if="wizard.campaign.targeting.age_min || wizard.campaign.targeting.age_max"
                variant="outline"
              >
                {{ wizard.campaign.targeting.age_min ?? 18 }}–{{ wizard.campaign.targeting.age_max ?? 100 }} {{ t('wizard.targeting.demographics.ageLabel') }}
              </Badge>
            </div>
          </template>

          <template v-else-if="section.key === 'landingPage'">
            <div v-if="wizard.landingPageSummary" class="flex items-center gap-2">
              <span class="text-sm font-medium">{{ wizard.landingPageSummary.name }}</span>
              <Badge variant="outline">{{ wizard.landingPageSummary.status }}</Badge>
            </div>
            <span v-else class="text-sm">
              {{ t('wizard.review.noLandingPage') }}
            </span>
          </template>

          <template v-else>
            <span class="text-sm">{{ scheduleLabel }}</span>
          </template>
        </CardContent>
      </Card>

      <Card v-if="wizard.estimate" data-estimation-card>
        <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            {{ t('wizard.review.sections.estimation') }}
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">{{ t('wizard.review.estimatedVolume') }}</span>
            <span class="font-medium" data-estimated-volume>
              {{ wizard.estimate.volume.toLocaleString('fr-FR') }}
            </span>
          </div>
          <template v-if="wizard.estimate.totalPrice != null">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">{{ t('wizard.review.estimatedCost') }}</span>
              <span class="text-lg font-semibold text-primary" data-estimated-cost>
                {{ formatCurrency(wizard.estimate.totalPrice) }}
              </span>
            </div>
            <Badge
              v-if="insufficientCredits"
              data-insufficient-credits
              variant="destructive"
            >
              {{ t('wizard.review.insufficientCredits') }}
            </Badge>
          </template>
        </CardContent>
      </Card>
    </div>

    <Alert v-if="!wizard.hasValidTargeting" variant="destructive" data-targeting-required-alert>
      <AlertCircle class="size-4" />
      <AlertDescription class="flex items-center justify-between">
        <span>{{ t('wizard.review.targetingRequired') }}</span>
        <Button variant="outline" size="sm" @click="wizard.goToStep(0)">
          {{ t('wizard.review.goToTargeting') }}
        </Button>
      </AlertDescription>
    </Alert>

    <Separator />

    <div class="space-y-3">
      <label class="flex items-center gap-3 text-sm">
        <Checkbox
          :model-value="wizard.reviewChecks.messageVerified"
          @update:model-value="wizard.reviewChecks.messageVerified = !!$event"
        />
        {{ t('wizard.review.checkMessage') }}
      </label>
      <label class="flex items-center gap-3 text-sm">
        <Checkbox
          :model-value="wizard.reviewChecks.sendConfirmed"
          @update:model-value="wizard.reviewChecks.sendConfirmed = !!$event"
        />
        {{ t('wizard.review.confirmSend') }}
      </label>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <Input
          data-phone-input
          :placeholder="t('wizard.review.testPhonePlaceholder')"
          :model-value="wizard.campaign.additional_phone || ''"
          class="w-44"
          @update:model-value="wizard.campaign.additional_phone = ($event as string) || null"
        />
        <Button variant="outline" data-test-button @click="handleTest">
          <FlaskConical class="mr-1.5 size-4" />
          {{ t('wizard.review.testButton') }}
        </Button>
      </div>

      <AlertDialog>
        <AlertDialogTrigger as-child>
          <Button data-launch-button :disabled="!canLaunch">
            <Send class="mr-1.5 size-4" />
            {{ t('wizard.review.launchButton') }}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ t('wizard.review.confirmDialog.title') }}</AlertDialogTitle>
            <AlertDialogDescription>
              <div class="space-y-2">
                <p>{{ t('wizard.review.confirmDialog.description') }}</p>
                <div class="rounded-md bg-muted p-3 text-sm" data-confirm-details>
                  <p class="font-semibold">{{ wizard.campaign.name }}</p>
                  <p>{{ t(`campaigns.type.${wizard.campaign.type}`) }}</p>
                  <p v-if="wizard.estimate">
                    {{ wizard.estimate.volume.toLocaleString('fr-FR') }} dest.
                    <template v-if="wizard.estimate.totalPrice != null">
                      — {{ formatCurrency(wizard.estimate.totalPrice) }}
                    </template>
                  </p>
                  <p v-if="wizard.campaign.scheduled_at">
                    {{ scheduleLabel }}
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{{ t('wizard.review.confirmDialog.cancel') }}</AlertDialogCancel>
            <AlertDialogAction @click="handleLaunch">
              {{ t('wizard.review.confirmDialog.confirm') }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>
</template>
