<script setup lang="ts">
const props = defineProps<{
  credits: number
}>()

const colorClass = computed(() => {
  if (props.credits > 1000) return 'text-success-700'
  if (props.credits >= 200) return 'text-warning-700'
  return 'text-error-700'
})

const formatted = computed(() => `${props.credits.toFixed(2)} EUR`)
</script>

<template>
  <span
    data-partner-credits-cell
    :class="['font-medium text-sm', colorClass]"
  >
    {{ formatted }}
  </span>
</template>
