<script setup lang="ts">
const props = defineProps<{
  isActive: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <span
    data-partner-status-badge
    :class="[
      isActive
        ? 'bg-success-100 text-success-700 border-success-500/30'
        : 'bg-error-100 text-error-700 border-error-500/30',
      'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
    ]"
  >
    {{ isActive ? t('hub.partners.status.active') : t('hub.partners.status.inactive') }}
  </span>
</template>
