<script setup lang="ts">
import { computed } from 'vue'
import type { LifecycleStatus } from '#operations/types/operations'
import { LIFECYCLE_CONFIG } from '#operations/types/operations'

const props = defineProps<{
  status: LifecycleStatus
}>()

const { t } = useI18n()

const config = computed(() => LIFECYCLE_CONFIG[props.status])

const colorClasses: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="colorClasses[config.color] ?? colorClasses.gray"
    :data-status="status"
  >
    {{ t(config.i18nKey) }}
  </span>
</template>
