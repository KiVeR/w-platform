<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import type { WizardStep } from '@/types/campaign'

const props = defineProps<{
  steps: WizardStep[]
  currentStep: number
  validation: boolean[]
}>()

const emit = defineEmits<{
  step: [index: number]
}>()

interface StepStyles {
  state: string
  button: string
  circle: string
}

function stepStyles(index: number): StepStyles {
  if (index < props.currentStep) {
    return {
      state: 'step-completed',
      button: 'cursor-pointer hover:bg-accent',
      circle: 'bg-primary text-primary-foreground',
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

function handleClick(index: number): void {
  if (index < props.currentStep) {
    emit('step', index)
  }
}

const { t } = useI18n()
</script>

<template>
  <nav class="flex items-center gap-1 overflow-x-auto px-1 py-2">
    <template v-for="(step, index) in steps" :key="step.key">
      <div
        v-if="index > 0"
        class="hidden h-px flex-1 sm:block"
        :class="index <= currentStep ? 'bg-primary' : 'bg-border'"
      />
      <button
        type="button"
        :data-step="step.key"
        class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
        :class="[stepStyles(index).state, stepStyles(index).button]"
        :disabled="index > currentStep"
        @click="handleClick(index)"
      >
        <span
          class="flex size-7 items-center justify-center rounded-full text-xs"
          :class="stepStyles(index).circle"
        >
          <Check v-if="index < currentStep" class="size-4" />
          <component :is="step.icon" v-else class="size-4" />
        </span>
        <span class="hidden sm:inline">{{ t(step.labelKey) }}</span>
        <span
          v-if="validation[index]"
          class="size-2 rounded-full bg-green-500"
        />
      </button>
    </template>
  </nav>
</template>
