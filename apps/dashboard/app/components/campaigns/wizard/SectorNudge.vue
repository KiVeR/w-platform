<script setup lang="ts">
import { ref } from 'vue'
import { Info, X } from 'lucide-vue-next'
import type { TargetingNudge } from '@/composables/useTargetingNudges'

defineProps<{
  nudges: TargetingNudge[]
}>()

const emit = defineEmits<{
  apply: [nudge: TargetingNudge]
}>()

const { t } = useI18n()

const dismissedKeys = ref<Set<string>>(new Set())

function isDismissed(nudge: TargetingNudge): boolean {
  const key = `sector-nudge-${nudge.type}`
  return dismissedKeys.value.has(key) || localStorage.getItem(key) === 'true'
}

function dismiss(nudge: TargetingNudge) {
  const key = `sector-nudge-${nudge.type}`
  const updated = new Set(dismissedKeys.value)
  updated.add(key)
  dismissedKeys.value = updated
  localStorage.setItem(key, 'true')
}
</script>

<template>
  <div v-if="nudges.length > 0" class="space-y-2" data-sector-nudges>
    <template v-for="nudge in nudges" :key="nudge.type">
      <div
        v-if="!isDismissed(nudge)"
        class="flex items-start gap-2 rounded-md border bg-blue-50 p-2.5 text-sm text-blue-800 dark:bg-blue-950/20 dark:text-blue-300"
        data-sector-nudge-card
      >
        <Info class="mt-0.5 size-4 shrink-0" />
        <span class="flex-1 text-xs text-muted-foreground">
          {{ t(nudge.messageKey, nudge.messageParams) }}
        </span>
        <button
          type="button"
          class="shrink-0 rounded-sm px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/30"
          data-sector-nudge-apply
          @click="emit('apply', nudge)"
        >
          {{ t('wizard.estimate.sectorNudge.apply') }}
        </button>
        <button
          type="button"
          class="shrink-0 rounded-sm p-0.5 opacity-60 hover:opacity-100"
          data-sector-nudge-dismiss
          @click="dismiss(nudge)"
        >
          <X class="size-3" />
        </button>
      </div>
    </template>
  </div>
</template>
