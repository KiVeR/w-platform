<script setup lang="ts">
import { computed } from 'vue'
import { Megaphone, MessageSquare, MapPin, LayoutTemplate, CalendarIcon, Pencil } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useCampaignWizardStore } from '@/stores/campaignWizard'

const wizard = useCampaignWizardStore()
const { t } = useI18n()

const canLaunch = computed(() =>
  wizard.reviewChecks.messageVerified && wizard.reviewChecks.sendConfirmed,
)

const scheduleLabel = computed(() => {
  if (wizard.scheduleMode === 'now') return t('wizard.review.sendNow')
  return wizard.campaign.scheduled_at ?? t('wizard.review.incomplete')
})

const sections = [
  { key: 'type', icon: Megaphone, step: 0 },
  { key: 'message', icon: MessageSquare, step: 1 },
  { key: 'targeting', icon: MapPin, step: 2 },
  { key: 'landingPage', icon: LayoutTemplate, step: 3 },
  { key: 'schedule', icon: CalendarIcon, step: 4 },
] as const

function sectionValue(key: string): string {
  switch (key) {
    case 'type':
      return t(`campaigns.type.${wizard.campaign.type}`)
    case 'message':
      return wizard.campaign.message || t('wizard.review.incomplete')
    case 'targeting': {
      const tgt = wizard.campaign.targeting
      if (tgt.method === 'department' && tgt.departments.length > 0)
        return `${tgt.departments.length} ${t('wizard.review.departments')}`
      if (tgt.method === 'postcode' && tgt.postcodes.length > 0)
        return `${tgt.postcodes.length} ${t('wizard.review.postcodes')}`
      if (tgt.method === 'address' && tgt.address)
        return t('wizard.review.addressRadius', { address: tgt.address, radius: tgt.radius })
      return t('wizard.review.incomplete')
    }
    case 'landingPage':
      return wizard.campaign.landing_page_id
        ? `LP #${wizard.campaign.landing_page_id}`
        : t('wizard.review.noLandingPage')
    case 'schedule':
      return scheduleLabel.value
    default:
      return ''
  }
}

async function handleLaunch(): Promise<void> {
  const success = wizard.scheduleMode === 'schedule'
    ? await wizard.scheduleCampaign()
    : await wizard.sendCampaign()

  if (success) navigateTo('/campaigns')
}

async function handleTest(): Promise<void> {
  wizard.campaign.is_demo = true
  await wizard.saveDraft()
  await wizard.sendCampaign()
}
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold">{{ t('wizard.review.title') }}</h2>

    <div class="space-y-3">
      <Card v-for="section in sections" :key="section.key">
        <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
          <div class="flex items-center gap-2">
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
          <p class="text-sm">
            <Badge v-if="section.key === 'type'" variant="secondary">
              {{ sectionValue(section.key) }}
            </Badge>
            <span v-else>{{ sectionValue(section.key) }}</span>
          </p>
        </CardContent>
      </Card>
    </div>

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

    <div class="flex gap-3">
      <Button variant="outline" @click="handleTest">
        {{ t('wizard.review.testButton') }}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger as-child>
          <Button
            data-launch-button
            :disabled="!canLaunch"
          >
            {{ t('wizard.review.launchButton') }}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ t('wizard.review.confirmDialog.title') }}</AlertDialogTitle>
            <AlertDialogDescription>{{ t('wizard.review.confirmDialog.description') }}</AlertDialogDescription>
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
