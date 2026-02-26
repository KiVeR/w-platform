<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from "reka-ui"
import { cn } from "@/lib/utils"
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from "reka-ui"

const props = defineProps<SliderRootProps>()
const emits = defineEmits<SliderRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <SliderRoot
    :class="cn('relative flex w-full touch-none select-none items-center', $attrs.class ?? '')"
    v-bind="forwarded"
  >
    <SliderTrack class="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
      <SliderRange class="absolute h-full bg-primary" />
    </SliderTrack>
    <SliderThumb
      v-for="(_, i) in (modelValue ?? [0])"
      :key="i"
      class="block size-4 rounded-full border-2 border-primary bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderRoot>
</template>
