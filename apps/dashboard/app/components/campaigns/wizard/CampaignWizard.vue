<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { toast } from 'vue-sonner'
import { Loader2, Check, AlertCircle, BarChart3 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatCurrency } from '@/utils/format'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import WizardStepper from '@/components/campaigns/wizard/WizardStepper.vue'
import WizardEstimatePanel from '@/components/campaigns/wizard/WizardEstimatePanel.vue'
import WizardSidebarPreview from '@/components/campaigns/wizard/WizardSidebarPreview.vue'
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
const progressPercent = computed(() => `${((wizard.currentStep + 1) / 6) * 100}%`)
const transitionDirection = ref<'forward' | 'backward'>('forward')
const transitionName = computed(() => `slide-${transitionDirection.value}`)
const mobileSheetOpen = ref(false)

const autosaveLabel = computed(() => {
  if (wizard.saveError) return t('wizard.autosave.error')
  if (wizard.isSaving) return t('wizard.autosave.saving')
  if (wizard.campaignId) return t('wizard.autosave.saved')
  return ''
})

function handleStepClick(step: number) {
  transitionDirection.value = step > wizard.currentStep ? 'forward' : 'backward'
  wizard.goToStep(step)
}

function handleBack() {
  transitionDirection.value = 'backward'
  wizard.prevStep()
}

async function handleNext() {
  if (!wizard.validateCurrentStep()) {
    toast.warning(t('wizard.validation.incomplete'), {
      description: t('wizard.validation.fillRequired'),
    })
    return
  }
  if (wizard.campaignId && wizard.isDirty) {
    await wizard.saveDraft()
  }
  transitionDirection.value = 'forward'
  wizard.nextStep()
  if (wizard.currentStep === 5) {
    wizard.requestEstimate()
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <div class="flex items-center gap-4">
      <div class="min-w-0 flex-1">
        <WizardStepper
          :steps="wizard.STEPS"
          :current-step="wizard.currentStep"
          :validation="wizard.stepValidation"
          @step="handleStepClick"
        />
      </div>
      <Badge
        v-if="autosaveLabel"
        variant="outline"
        data-autosave-badge
        class="shrink-0 gap-1.5 text-xs"
        :class="wizard.saveError
          ? 'border-destructive/30 bg-destructive/5 text-destructive'
          : wizard.isSaving
            ? 'border-warning-500/30 bg-warning-50 text-warning-700'
            : 'border-success-500/30 bg-success-50 text-success-700'"
      >
        <Loader2 v-if="wizard.isSaving" class="size-3 animate-spin" />
        <AlertCircle v-else-if="wizard.saveError" class="size-3" />
        <Check v-else class="size-3" />
        {{ autosaveLabel }}
      </Badge>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div class="relative min-h-100 overflow-hidden">
        <Transition :name="transitionName" mode="out-in">
          <component :is="stepComponents[wizard.currentStep]" :key="wizard.currentStep" />
        </Transition>
      </div>

      <aside class="hidden lg:block">
        <div class="sticky top-6">
          <WizardSidebarPreview v-if="wizard.currentStep <= 1" />
          <WizardEstimatePanel v-else :current-step="wizard.currentStep" />
        </div>
      </aside>
    </div>

    <div class="sticky bottom-0 z-10 -mx-4 md:-mx-6" data-wizard-nav>
      <div class="h-0.5 bg-primary/20">
        <div class="h-full bg-primary transition-all duration-300" :style="{ width: progressPercent }" data-progress-bar />
      </div>
      <div class="flex items-center justify-between border-t bg-background/80 px-4 py-3 backdrop-blur-sm md:px-6">
        <Button
          v-if="wizard.currentStep > 0"
          variant="outline"
          @click="handleBack"
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

    <!-- Mobile estimate FAB + Sheet (visible only under lg breakpoint) -->
    <Button
      data-mobile-estimate-fab
      class="fixed bottom-20 right-4 z-20 size-12 rounded-full shadow-lg lg:hidden"
      @click="mobileSheetOpen = true"
    >
      <BarChart3 class="size-5" />
      <Badge
        v-if="wizard.estimate?.totalPrice != null"
        class="absolute -top-1 -right-1 px-1.5 text-[10px]"
      >
        {{ formatCurrency(wizard.estimate.totalPrice) }}
      </Badge>
    </Button>

    <Sheet v-model:open="mobileSheetOpen">
      <SheetContent side="bottom" class="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{{ t('wizard.estimate.title') }}</SheetTitle>
        </SheetHeader>
        <div class="px-4 pb-6">
          <WizardEstimatePanel :current-step="wizard.currentStep" />
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
