<script setup lang="ts">
import type { DashboardPeriod } from '@/composables/useDashboardStats'

const props = defineProps<{
  modelValue: DashboardPeriod
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DashboardPeriod]
  change: [value: DashboardPeriod]
}>()

const { t } = useI18n()

const options: DashboardPeriod[] = ['7d', '30d', '90d']

function handleSelect(value: DashboardPeriod) {
  if (props.disabled || props.modelValue === value) return
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <div
    data-period-selector
    class="inline-flex rounded-full border border-border/80 bg-card/90 p-1 shadow-sm backdrop-blur-sm"
  >
    <button
      v-for="option in options"
      :key="option"
      :data-period-button="option"
      :data-active="modelValue === option"
      class="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-150"
      :class="modelValue === option ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted hover:text-foreground'"
      :disabled="disabled"
      @click="handleSelect(option)"
    >
      {{ t(`dashboard.periods.${option}`) }}
    </button>
  </div>
</template>
