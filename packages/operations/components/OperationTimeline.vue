<script setup lang="ts">
import type { OperationTransition } from '#operations/types/operations'
import { LIFECYCLE_CONFIG } from '#operations/types/operations'
import type { LifecycleStatus } from '#operations/types/operations'

defineProps<{
  transitions: OperationTransition[]
  isLoading: boolean
}>()

const { t } = useI18n()

function getStatusLabel(state: string): string {
  const config = LIFECYCLE_CONFIG[state as LifecycleStatus]
  return config ? t(config.i18nKey) : state
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div data-testid="timeline">
    <div v-if="isLoading" class="py-4 text-center text-muted-foreground">
      {{ t('operations.timeline.loading') }}
    </div>

    <div v-else-if="transitions.length === 0" class="py-4 text-center text-muted-foreground" data-testid="timeline-empty">
      {{ t('operations.timeline.empty') }}
    </div>

    <div v-else class="space-y-0">
      <div
        v-for="(transition, index) in transitions"
        :key="transition.id"
        class="relative flex gap-4 pb-6"
        :data-transition-id="transition.id"
      >
        <!-- Vertical line -->
        <div class="flex flex-col items-center">
          <div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
            <div class="h-2 w-2 rounded-full bg-primary" />
          </div>
          <div
            v-if="index < transitions.length - 1"
            class="w-px flex-1 bg-border"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 pb-2">
          <div class="flex items-baseline gap-2">
            <span class="text-sm font-medium">
              {{ getStatusLabel(transition.from_state) }}
            </span>
            <span class="text-muted-foreground">&rarr;</span>
            <span class="text-sm font-medium">
              {{ getStatusLabel(transition.to_state) }}
            </span>
          </div>
          <div class="mt-1 text-xs text-muted-foreground">
            <span v-if="transition.user">{{ transition.user.full_name }} &middot; </span>
            <span>{{ formatDateTime(transition.created_at) }}</span>
          </div>
          <p v-if="transition.reason" class="mt-1 text-sm text-muted-foreground italic">
            {{ transition.reason }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
