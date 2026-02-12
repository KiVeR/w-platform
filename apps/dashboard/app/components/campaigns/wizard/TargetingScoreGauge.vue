<script setup lang="ts">
import { useTargetingScore } from '@/composables/useTargetingScore'

const props = defineProps<{
  volume: number
}>()

const score = useTargetingScore(() => props.volume)

const SEGMENTS = [
  { color: 'bg-destructive' },
  { color: 'bg-warning' },
  { color: 'bg-success' },
  { color: 'bg-warning' },
  { color: 'bg-destructive' },
]
</script>

<template>
  <div
    class="space-y-1.5"
    role="meter"
    :aria-valuenow="volume"
    :aria-valuetext="score.label"
    aria-valuemin="0"
    aria-live="polite"
    data-targeting-gauge
  >
    <!-- Gauge bar -->
    <div class="relative h-2 rounded-full overflow-hidden flex">
      <div
        v-for="(seg, i) in SEGMENTS"
        :key="i"
        class="flex-1"
        :class="seg.color"
        data-gauge-segment
      />
      <!-- Marker -->
      <div
        class="absolute top-0 h-full w-0.5 bg-foreground transition-[left] duration-400 ease-out"
        :style="{ left: `${score.position}%` }"
        data-gauge-marker
      />
    </div>
    <!-- Label -->
    <p class="text-xs font-medium" :class="score.color" data-gauge-label>
      {{ score.label }}
    </p>
  </div>
</template>
