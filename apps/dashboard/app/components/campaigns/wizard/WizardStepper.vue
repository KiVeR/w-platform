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
  return {
    state: 'step-future',
    button: 'cursor-default text-muted-foreground opacity-50',
    circle: 'bg-muted text-muted-foreground',
  }
}

const styles = computed(() =>
  props.steps.map((_, i) => computeStepStyle(i)),
)

function dividerClass(index: number): string {
  if (index <= props.currentStep) {
    const prevValid = props.validation[index - 1]
    const curValid = props.validation[index]
    if (index < props.currentStep) {
      return prevValid && curValid ? 'bg-success-500' : 'bg-warning-500'
    }
    return 'bg-primary'
  }
  return 'bg-border'
}

function handleClick(index: number): void {
  if (index < props.currentStep) {
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
        <Tooltip v-if="index < currentStep">
          <TooltipTrigger as-child>
            <button
              type="button"
              :data-step="step.key"
              :data-step-valid="validation[index] ? 'true' : 'false'"
              class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="[styles[index].state, styles[index].button]"
              @click="handleClick(index)"
            >
              <span
                class="flex size-7 items-center justify-center rounded-full text-xs transition-colors duration-200"
                :class="styles[index].circle"
              >
                <Check v-if="validation[index]" class="size-4" />
                <AlertTriangle v-else class="size-4" />
              </span>
              <span class="hidden sm:inline">{{ t(step.labelKey) }}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {{ validation[index] ? t('wizard.stepper.valid') : t('wizard.stepper.incomplete') }}
          </TooltipContent>
        </Tooltip>
        <button
          v-else
          type="button"
          :data-step="step.key"
          class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
          :class="[styles[index].state, styles[index].button]"
          :disabled="index > currentStep"
          @click="handleClick(index)"
        >
          <span
            class="flex size-7 items-center justify-center rounded-full text-xs transition-colors duration-200"
            :class="styles[index].circle"
          >
            <component :is="step.icon" class="size-4" />
          </span>
          <span class="hidden sm:inline">{{ t(step.labelKey) }}</span>
        </button>
      </template>
    </nav>
  </TooltipProvider>
</template>
