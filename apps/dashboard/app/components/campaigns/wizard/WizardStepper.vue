<script setup lang="ts">
import { computed } from 'vue'
import { Check, AlertTriangle } from 'lucide-vue-next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { WizardStep } from '@/types/campaign'

const props = defineProps<{
  steps: WizardStep[]
  currentStep: number
  validation: boolean[]
}>()

const emit = defineEmits<{
  step: [index: number]
}>()

interface StepStyle {
  state: string
  button: string
  circle: string
}

function computeStepStyle(index: number): StepStyle {
  if (index < props.currentStep) {
    const valid = props.validation[index]
    return {
      state: 'step-completed',
      button: 'cursor-pointer hover:bg-accent',
      circle: valid
        ? 'bg-success-500 text-white'
        : 'bg-warning-500 text-white',
    }
  }
  if (index === props.currentStep) {
    return {
      state: 'step-current',
      button: 'bg-primary/10 font-semibold text-primary ring-1 ring-primary/30',
      circle: 'bg-primary text-primary-foreground',
    }
  }
  // Step 0 (estimate) is always accessible from any step
  if (index === 0) {
    return {
      state: 'step-accessible',
      button: 'cursor-pointer hover:bg-accent text-muted-foreground',
      circle: 'bg-muted text-muted-foreground border border-dashed border-primary/40',
    }
  }
  return {
    state: 'step-future',
    button: 'cursor-default text-muted-foreground opacity-50',
    circle: 'bg-muted text-muted-foreground',
  }
}

const styles = computed(() =>
  props.steps.map((_, i) => computeStepStyle(i)),
)

function styleFor(index: number): StepStyle {
  return styles.value[index] ?? computeStepStyle(index)
}

function isStepValid(index: number): boolean {
  return props.validation[index] ?? false
}

function dividerClass(index: number): string {
  if (index > props.currentStep) return 'bg-border'
  if (index === props.currentStep) return 'bg-primary'

  const bothValid = isStepValid(index - 1) && isStepValid(index)
  return bothValid ? 'bg-success-500' : 'bg-warning-500'
}

function handleClick(index: number): void {
  // Step 0 (estimate) is always clickable from any step
  if (index === 0 || index < props.currentStep) {
    emit('step', index)
  }
}

const { t } = useI18n()
</script>

<template>
  <TooltipProvider>
    <nav class="flex items-center gap-1 overflow-x-auto px-1 py-2">
      <template v-for="(step, index) in steps" :key="step.key">
        <div
          v-if="index > 0"
          class="hidden h-px flex-1 sm:block"
          :class="dividerClass(index)"
          data-divider
        />
        <Tooltip v-if="index < currentStep || (index === 0 && index !== currentStep)">
          <TooltipTrigger as-child>
            <button
              type="button"
              :data-step="step.key"
              :data-step-valid="isStepValid(index) ? 'true' : 'false'"
              class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="[styleFor(index).state, styleFor(index).button]"
              @click="handleClick(index)"
            >
              <span
                class="flex size-7 items-center justify-center rounded-full text-xs transition-colors duration-200"
                :class="styleFor(index).circle"
              >
                <template v-if="index < currentStep">
                  <Check v-if="isStepValid(index)" class="size-4" />
                  <AlertTriangle v-else class="size-4" />
                </template>
                <component :is="step.icon" v-else class="size-4" />
              </span>
              <span class="hidden max-w-20 truncate sm:inline">{{ t(step.labelKey) }}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <template v-if="index < currentStep">
              {{ validation[index] ? t('wizard.stepper.valid') : t('wizard.stepper.incomplete') }}
            </template>
            <template v-else>
              {{ t('wizard.stepper.goToEstimate') }}
            </template>
          </TooltipContent>
        </Tooltip>
        <button
          v-else
          type="button"
          :data-step="step.key"
          class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
          :class="[styleFor(index).state, styleFor(index).button]"
          :disabled="index > currentStep"
          @click="handleClick(index)"
        >
          <span
            class="flex size-7 items-center justify-center rounded-full text-xs transition-colors duration-200"
            :class="styleFor(index).circle"
          >
            <component :is="step.icon" class="size-4" />
          </span>
          <span
            class="max-w-20 truncate"
            :class="index === currentStep ? 'inline' : 'hidden sm:inline'"
          >{{ t(step.labelKey) }}</span>
        </button>
      </template>
    </nav>

    <!-- Mobile step indicator -->
    <p class="text-center text-xs text-muted-foreground sm:hidden" data-mobile-step-indicator>
      {{ t('wizard.stepper.mobileIndicator', { current: currentStep + 1, total: steps.length }) }}
    </p>
  </TooltipProvider>
</template>
