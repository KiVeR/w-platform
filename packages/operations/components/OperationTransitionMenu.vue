<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LifecycleStatus } from '#operations/types/operations'
import { LIFECYCLE_CONFIG, LIFECYCLE_TRANSITIONS } from '#operations/types/operations'

const props = defineProps<{
  currentStatus: LifecycleStatus
  operationId: number
  isTransitioning: boolean
  transitionError?: string | null
}>()

const emit = defineEmits<{
  transition: [toState: LifecycleStatus, reason?: string]
}>()

const { t } = useI18n()

const showConfirm = ref(false)
const pendingTransition = ref<LifecycleStatus | null>(null)
const reason = ref('')

const allowedTargets = computed(() => LIFECYCLE_TRANSITIONS[props.currentStatus] ?? [])

function requestTransition(toState: LifecycleStatus) {
  pendingTransition.value = toState
  reason.value = ''
  showConfirm.value = true
}

function confirmTransition() {
  if (pendingTransition.value) {
    emit('transition', pendingTransition.value, reason.value || undefined)
    showConfirm.value = false
    pendingTransition.value = null
    reason.value = ''
  }
}

function cancelTransition() {
  showConfirm.value = false
  pendingTransition.value = null
  reason.value = ''
}
</script>

<template>
  <div class="relative" data-testid="transition-menu">
    <!-- Transition error -->
    <p v-if="transitionError" class="text-sm text-destructive mt-1" data-testid="transition-error">{{ transitionError }}</p>

    <!-- Transition buttons -->
    <div v-if="allowedTargets.length > 0" class="flex flex-wrap gap-2">
      <button
        v-for="target in allowedTargets"
        :key="target"
        :disabled="isTransitioning"
        class="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        :data-transition="target"
        @click="requestTransition(target)"
      >
        {{ t(LIFECYCLE_CONFIG[target].i18nKey) }}
      </button>
    </div>
    <p v-else class="text-sm text-muted-foreground" data-testid="no-transitions">
      {{ t('operations.transitions.none') }}
    </p>

    <!-- Confirmation dialog -->
    <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="confirm-dialog">
      <div class="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h3 class="text-lg font-semibold">
          {{ t('operations.transitions.confirm_title') }}
        </h3>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ t('operations.transitions.confirm_message', {
            from: t(LIFECYCLE_CONFIG[currentStatus].i18nKey),
            to: pendingTransition ? t(LIFECYCLE_CONFIG[pendingTransition].i18nKey) : '',
          }) }}
        </p>
        <textarea
          v-model="reason"
          class="mt-4 w-full rounded-md border p-2 text-sm"
          :placeholder="t('operations.transitions.reason_placeholder')"
          rows="2"
          data-testid="transition-reason"
        />
        <div class="mt-4 flex justify-end gap-2">
          <button
            class="rounded-md border px-4 py-2 text-sm"
            data-testid="cancel-btn"
            @click="cancelTransition"
          >
            {{ t('operations.transitions.cancel') }}
          </button>
          <button
            class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            :disabled="isTransitioning"
            data-testid="confirm-btn"
            @click="confirmTransition"
          >
            {{ t('operations.transitions.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
