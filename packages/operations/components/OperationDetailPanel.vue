<script setup lang="ts">
import { ref } from 'vue'
import type { OperationDetail, OperationTransition } from '#operations/types/operations'
import { OPERATION_TYPE_CONFIG } from '#operations/types/operations'

const props = defineProps<{
  operation: OperationDetail
  transitions: OperationTransition[]
  isLoadingTransitions: boolean
  isTransitioning: boolean
}>()

const emit = defineEmits<{
  transition: [toState: string, reason?: string]
}>()

const { t, locale } = useI18n()

const activeTab = ref<'summary' | 'timeline' | 'billing'>('summary')

function getTypeLabel(): string {
  const config = OPERATION_TYPE_CONFIG[props.operation.type]
  return config ? t(config.i18nKey) : props.operation.type
}

function formatPrice(value: number | null): string {
  if (value == null) return '-'
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'EUR' }).format(value)
}

function formatVolume(value: number | null): string {
  if (value == null) return '-'
  return new Intl.NumberFormat(locale.value).format(value)
}
</script>

<template>
  <div class="space-y-6" data-testid="detail-panel">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-xl font-semibold">
          {{ operation.name }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ operation.ref_operation }} &middot; {{ getTypeLabel() }}
        </p>
      </div>
      <OperationStatusBadge :status="operation.lifecycle_status" />
    </div>

    <!-- Transition actions -->
    <OperationTransitionMenu
      :current-status="operation.lifecycle_status"
      :operation-id="operation.id"
      :is-transitioning="isTransitioning"
      @transition="(to, reason) => emit('transition', to, reason)"
    />

    <!-- Tabs -->
    <div class="border-b">
      <nav class="flex gap-4">
        <button
          v-for="tab in (['summary', 'timeline', 'billing'] as const)"
          :key="tab"
          class="border-b-2 px-1 py-2 text-sm font-medium transition-colors"
          :class="activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
          :data-tab="tab"
          @click="activeTab = tab"
        >
          {{ t('operations.tabs.' + tab) }}
        </button>
      </nav>
    </div>

    <!-- Tab: Summary -->
    <div v-if="activeTab === 'summary'" class="space-y-4" data-testid="tab-summary">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-xs font-medium text-muted-foreground">{{ t('operations.detail.demande') }}</p>
          <p class="text-sm">{{ operation.demande?.ref_demande ?? '-' }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-muted-foreground">{{ t('operations.detail.partner') }}</p>
          <p class="text-sm">{{ operation.demande?.partner?.name ?? '-' }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-muted-foreground">{{ t('operations.detail.advertiser') }}</p>
          <p class="text-sm">{{ operation.advertiser ?? '-' }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-muted-foreground">{{ t('operations.detail.assigned') }}</p>
          <p class="text-sm">{{ operation.assigned_user?.full_name ?? '-' }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-muted-foreground">{{ t('operations.detail.volume_estimated') }}</p>
          <p class="text-sm">{{ formatVolume(operation.volume_estimated) }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-muted-foreground">{{ t('operations.detail.volume_sent') }}</p>
          <p class="text-sm">{{ formatVolume(operation.volume_sent) }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-muted-foreground">{{ t('operations.detail.unit_price') }}</p>
          <p class="text-sm">{{ formatPrice(operation.unit_price) }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-muted-foreground">{{ t('operations.detail.total_price') }}</p>
          <p class="text-sm">{{ formatPrice(operation.total_price) }}</p>
        </div>
      </div>

      <div v-if="operation.message" class="rounded-md border p-4">
        <p class="text-xs font-medium text-muted-foreground">{{ t('operations.detail.message') }}</p>
        <p class="mt-1 text-sm whitespace-pre-wrap">{{ operation.message }}</p>
      </div>
    </div>

    <!-- Tab: Timeline -->
    <div v-if="activeTab === 'timeline'" data-testid="tab-timeline">
      <OperationTimeline
        :transitions="transitions"
        :is-loading="isLoadingTransitions"
      />
    </div>

    <!-- Tab: Billing (stub) -->
    <div v-if="activeTab === 'billing'" class="py-8 text-center text-muted-foreground" data-testid="tab-billing">
      {{ t('operations.billing.coming_soon') }}
    </div>
  </div>
</template>
