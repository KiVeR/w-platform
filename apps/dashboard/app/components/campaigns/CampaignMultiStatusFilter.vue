<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import type { CampaignStatus } from '@/types/campaign'

const props = defineProps<{
  modelValue: CampaignStatus[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CampaignStatus[]]
}>()

const { t } = useI18n()

const statusOptions: { value: CampaignStatus, labelKey: string }[] = [
  { value: 'draft', labelKey: 'campaigns.status.draft' },
  { value: 'scheduled', labelKey: 'campaigns.status.scheduled' },
  { value: 'sending', labelKey: 'campaigns.status.sending' },
  { value: 'sent', labelKey: 'campaigns.status.sent' },
  { value: 'cancelled', labelKey: 'campaigns.status.cancelled' },
  { value: 'failed', labelKey: 'campaigns.status.failed' },
]

const selectedSummary = computed(() => {
  if (props.modelValue.length === 0) {
    return t('campaigns.filters.allStatuses')
  }

  return statusOptions
    .filter(option => props.modelValue.includes(option.value))
    .map(option => t(option.labelKey))
    .join(', ')
})

function toggleStatus(status: CampaignStatus) {
  const next = props.modelValue.includes(status)
    ? props.modelValue.filter(value => value !== status)
    : [...props.modelValue, status]

  emit('update:modelValue', next)
}

function clear() {
  emit('update:modelValue', [])
}
</script>

<template>
  <div class="rounded-xl border bg-background p-3 shadow-xs">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm font-medium">
          {{ t('campaigns.filters.statusLabel') }}
        </p>
        <p class="truncate text-xs text-muted-foreground">
          {{ selectedSummary }}
        </p>
      </div>

      <Button
        data-status-clear
        size="sm"
        variant="ghost"
        :disabled="modelValue.length === 0"
        @click="clear"
      >
        {{ t('campaigns.filters.clear') }}
      </Button>
    </div>

    <div class="mt-3 flex flex-wrap gap-2">
      <Button
        v-for="option in statusOptions"
        :key="option.value"
        :data-status="option.value"
        size="sm"
        :variant="modelValue.includes(option.value) ? 'default' : 'outline'"
        @click="toggleStatus(option.value)"
      >
        {{ t(option.labelKey) }}
      </Button>
    </div>
  </div>
</template>
