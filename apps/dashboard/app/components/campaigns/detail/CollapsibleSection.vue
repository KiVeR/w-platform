<script setup lang="ts">
import { computed, ref, type Component, type HTMLAttributes } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  title: string
  badge?: string | number | null
  defaultOpen?: boolean
  icon?: Component
  open?: boolean
  class?: HTMLAttributes['class']
}>(), {
  badge: null,
  defaultOpen: false,
  icon: undefined,
  open: undefined,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const internalOpen = ref(props.defaultOpen)

const isControlled = computed(() => props.open !== undefined)
const isOpen = computed(() => (isControlled.value ? props.open : internalOpen.value) ?? false)

function toggle(): void {
  const nextValue = !isOpen.value

  if (!isControlled.value) {
    internalOpen.value = nextValue
  }

  emit('update:open', nextValue)
}
</script>

<template>
  <Card
    data-collapsible-section
    :data-state="isOpen ? 'open' : 'closed'"
    :class="cn('gap-0 overflow-hidden py-0', props.class)"
  >
    <button
      type="button"
      data-collapsible-trigger
      class="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <div class="flex min-w-0 items-center gap-3">
        <component
          :is="icon"
          v-if="icon"
          class="size-4 shrink-0 text-muted-foreground"
          :stroke-width="1.75"
        />

        <h3 class="truncate text-sm font-semibold text-foreground">
          {{ title }}
        </h3>
      </div>

      <div class="flex items-center gap-3">
        <Badge
          v-if="badge !== null && badge !== undefined"
          data-collapsible-badge
          variant="outline"
          class="shrink-0 rounded-full px-2.5 py-0.5 text-xs"
        >
          {{ badge }}
        </Badge>

        <ChevronDown
          class="size-4 shrink-0 text-muted-foreground transition-transform duration-200"
          :class="{ 'rotate-180': isOpen }"
        />
      </div>
    </button>

    <transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <CardContent
        v-if="isOpen"
        data-collapsible-content
        class="border-t border-border/70 px-6 pb-6 pt-5"
      >
        <slot />
      </CardContent>
    </transition>
  </Card>
</template>
