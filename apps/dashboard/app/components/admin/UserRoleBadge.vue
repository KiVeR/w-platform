<script setup lang="ts">
const props = defineProps<{
  role: string
}>()

const colorMap: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 border-purple-500/30',
  adv: 'bg-blue-100 text-blue-700 border-blue-500/30',
  partner: 'bg-emerald-100 text-emerald-700 border-emerald-500/30',
  merchant: 'bg-amber-100 text-amber-700 border-amber-500/30',
  employee: 'bg-gray-100 text-gray-700 border-gray-500/30',
}

const badgeClass = computed(() => {
  return colorMap[props.role] ?? 'bg-gray-100 text-gray-700 border-gray-500/30'
})
</script>

<template>
  <span
    data-user-role-badge
    :data-role="role"
    :class="[
      badgeClass,
      'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold capitalize',
    ]"
  >
    {{ role }}
  </span>
</template>
