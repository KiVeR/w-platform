<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'

withDefaults(defineProps<{
  variant?: 'cards' | 'table' | 'full'
}>(), {
  variant: 'full',
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header skeleton -->
    <div class="flex items-center gap-4">
      <Skeleton class="h-8 w-48" />
      <Skeleton class="h-8 w-24" />
    </div>

    <!-- Cards skeleton -->
    <div
      v-if="variant === 'cards' || variant === 'full'"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <div v-for="i in 3" :key="i" class="space-y-3 rounded-lg border p-6">
        <Skeleton class="h-4 w-3/4" />
        <Skeleton class="h-4 w-1/2" />
      </div>
    </div>

    <!-- Table skeleton -->
    <div
      v-if="variant === 'table' || variant === 'full'"
      class="space-y-3 rounded-lg border p-6"
    >
      <div v-for="i in 5" :key="i" class="flex gap-4">
        <Skeleton class="h-4 flex-1" />
        <Skeleton class="h-4 flex-1" />
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-4 w-20" />
      </div>
    </div>
  </div>
</template>
