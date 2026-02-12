<script setup lang="ts">
import { computed, ref } from 'vue'
import { TrendingDown, X } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@/components/ui/alert'

const props = defineProps<{
  nextTier: { volumeThreshold: number, unitPrice: number, savingsPercent: number }
  currentVolume: number
}>()

const { t } = useI18n()

const volumeGap = computed(() => props.nextTier.volumeThreshold - props.currentVolume)
const isClose = computed(() => volumeGap.value <= props.currentVolume * 0.20)
const dismissed = ref(sessionStorage.getItem('pricing-tier-nudge-dismissed') === 'true')

function dismiss() {
  dismissed.value = true
  sessionStorage.setItem('pricing-tier-nudge-dismissed', 'true')
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    leave-active-class="transition-all duration-200 ease-in"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <Alert
      v-if="isClose && !dismissed"
      variant="default"
      class="relative border-l-4 border-l-success bg-success/5"
      data-pricing-nudge
    >
      <TrendingDown class="size-4 text-success" />
      <AlertDescription class="pr-6">
        {{ t('wizard.estimate.pricingNudge.message', {
          gap: volumeGap.toLocaleString('fr-FR'),
          savings: nextTier.savingsPercent,
        }) }}
      </AlertDescription>
      <button
        type="button"
        class="absolute right-2 top-2 rounded-sm p-0.5 opacity-70 hover:opacity-100"
        data-pricing-nudge-dismiss
        @click="dismiss"
      >
        <X class="size-3.5" />
      </button>
    </Alert>
  </Transition>
</template>
