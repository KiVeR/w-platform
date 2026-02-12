<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSeasonalNudge } from '@/composables/useSeasonalNudge'

const { t } = useI18n()
const { nudge, dismiss } = useSeasonalNudge()

const collapsing = ref(false)

function handleDismiss() {
  collapsing.value = true
  setTimeout(() => {
    dismiss()
  }, 250)
}
</script>

<template>
  <Transition
    leave-active-class="transition-all duration-250 ease-out"
    leave-to-class="opacity-0 max-h-0 overflow-hidden"
  >
    <Alert
      v-if="nudge && !collapsing"
      class="relative border"
      :class="nudge.colorClass"
      data-seasonal-banner
    >
      <component :is="nudge.icon" class="size-4" />
      <AlertDescription class="pr-6">
        <strong>{{ t(nudge.titleKey) }}</strong> — {{ t(nudge.descKey) }}
      </AlertDescription>
      <button
        type="button"
        class="absolute right-2 top-2 rounded-sm p-0.5 opacity-70 hover:opacity-100"
        data-seasonal-dismiss
        @click="handleDismiss"
      >
        <X class="size-3.5" />
      </button>
    </Alert>
  </Transition>
</template>
