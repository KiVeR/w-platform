<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Loader2, Check } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import WizardStepper from '@/components/campaigns/wizard/WizardStepper.vue'
import WizardEstimatePanel from '@/components/campaigns/wizard/WizardEstimatePanel.vue'
import StepType from '@/components/campaigns/wizard/StepType.vue'
import StepSchedule from '@/components/campaigns/wizard/StepSchedule.vue'
import StepReview from '@/components/campaigns/wizard/StepReview.vue'
import StepLandingPage from '@/components/campaigns/wizard/StepLandingPage.vue'
import StepMessage from '@/components/campaigns/wizard/StepMessage.vue'
import StepTargeting from '@/components/campaigns/wizard/StepTargeting.vue'

const wizard = useCampaignWizardStore()
const { t } = useI18n()

const stepComponents: Component[] = [
  StepType,
  StepMessage,
  StepTargeting,
  StepLandingPage,
  StepSchedule,
  StepReview,
]

const isLastStep = computed(() => wizard.currentStep === 5)

const autosaveLabel = computed(() => {
  if (wizard.saveError) return t('wizard.autosave.error')
  if (wizard.isSaving) return t('wizard.autosave.saving')
  if (wizard.campaignId) return t('wizard.autosave.saved')
  return ''
})

async function handleNext() {
  if (!wizard.validateCurrentStep()) return
  if (wizard.campaignId && wizard.isDirty) {
    await wizard.saveDraft()
  }
  wizard.nextStep()
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ t('wizard.title') }}</h1>
      <div v-if="autosaveLabel" class="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 v-if="wizard.isSaving" class="size-4 animate-spin" />
        <Check v-else-if="wizard.campaignId && !wizard.saveError" class="size-4 text-green-500" />
        <span>{{ autosaveLabel }}</span>
      </div>
    </div>

    <WizardStepper
      :steps="wizard.STEPS"
      :current-step="wizard.currentStep"
      :validation="[false, false, false, false, false, false]"
      @step="wizard.goToStep"
    />

    <div class="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div class="min-h-100">
        <component :is="stepComponents[wizard.currentStep]" />
      </div>

      <aside class="hidden lg:block">
        <div class="sticky top-6">
          <WizardEstimatePanel />
        </div>
      </aside>
    </div>

    <div class="flex items-center justify-between border-t pt-4">
      <Button
        v-if="wizard.currentStep > 0"
        variant="outline"
        @click="wizard.prevStep()"
      >
        {{ t('wizard.nav.back') }}
      </Button>
      <div v-else />

      <Button
        v-if="!isLastStep"
        @click="handleNext"
      >
        {{ t('wizard.nav.next') }}
      </Button>
    </div>
  </div>
</template>
