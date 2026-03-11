<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DateRangeValue {
  from: string
  to: string
}

const props = defineProps<{
  modelValue: DateRangeValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DateRangeValue]
}>()

const { t } = useI18n()

const hasValue = computed(() => Boolean(props.modelValue.from || props.modelValue.to))

const summary = computed(() => {
  if (!hasValue.value) {
    return t('campaigns.filters.allDates')
  }

  return `${props.modelValue.from || '…'} → ${props.modelValue.to || '…'}`
})

function updateFrom(value: string | number) {
  emit('update:modelValue', {
    from: String(value || ''),
    to: props.modelValue.to,
  })
}

function updateTo(value: string | number) {
  emit('update:modelValue', {
    from: props.modelValue.from,
    to: String(value || ''),
  })
}

function clear() {
  emit('update:modelValue', { from: '', to: '' })
}
</script>

<template>
  <div class="rounded-xl border bg-background p-3 shadow-xs">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm font-medium">
          {{ t('campaigns.filters.dateLabel') }}
        </p>
        <p class="truncate text-xs text-muted-foreground">
          {{ summary }}
        </p>
      </div>

      <Button
        data-date-clear
        size="sm"
        variant="ghost"
        :disabled="!hasValue"
        @click="clear"
      >
        {{ t('campaigns.filters.clear') }}
      </Button>
    </div>

    <div class="mt-3 grid gap-3 sm:grid-cols-2">
      <label class="space-y-2 text-xs font-medium text-muted-foreground">
        <span>{{ t('campaigns.filters.from') }}</span>
        <Input
          data-date-from
          type="date"
          :model-value="modelValue.from"
          :max="modelValue.to || undefined"
          @update:model-value="updateFrom"
        />
      </label>

      <label class="space-y-2 text-xs font-medium text-muted-foreground">
        <span>{{ t('campaigns.filters.to') }}</span>
        <Input
          data-date-to
          type="date"
          :model-value="modelValue.to"
          :min="modelValue.from || undefined"
          @update:model-value="updateTo"
        />
      </label>
    </div>
  </div>
</template>
