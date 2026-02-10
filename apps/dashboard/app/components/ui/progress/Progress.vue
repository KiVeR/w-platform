<script setup lang="ts">
import type { ProgressRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { computed } from "vue"
import {
  ProgressIndicator,
  ProgressRoot,
} from "reka-ui"
import { cn } from "@/lib/utils"

const props = withDefaults(
  defineProps<ProgressRootProps & {
    class?: HTMLAttributes["class"]
    color?: 'primary' | 'success' | 'warning' | 'error'
  }>(),
  {
    modelValue: 0,
    color: 'primary',
  },
)

const delegatedProps = reactiveOmit(props, "class", "color")

const trackClass = computed(() => {
  const map: Record<string, string> = {
    primary: 'bg-primary/20',
    success: 'bg-success-500/20',
    warning: 'bg-warning-500/20',
    error: 'bg-error-500/20',
  }
  return map[props.color]
})

const indicatorClass = computed(() => {
  const map: Record<string, string> = {
    primary: 'bg-primary',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  }
  return map[props.color]
})
</script>

<template>
  <ProgressRoot
    data-slot="progress"
    v-bind="delegatedProps"
    :class="
      cn(
        'relative h-2 w-full overflow-hidden rounded-full',
        trackClass,
        props.class,
      )
    "
  >
    <ProgressIndicator
      data-slot="progress-indicator"
      :class="cn('h-full w-full flex-1 transition-all', indicatorClass)"
      :style="`transform: translateX(-${100 - (props.modelValue ?? 0)}%);`"
    />
  </ProgressRoot>
</template>
