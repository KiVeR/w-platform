<script setup lang="ts">
import { computed } from 'vue'
import * as icons from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const props = withDefaults(defineProps<{
  icon?: string
  title: string
  description: string
  retryLabel?: string
  backLabel?: string
  backTo?: string
}>(), {
  icon: 'ServerCrash',
  retryLabel: 'Réessayer',
})

const emit = defineEmits<{
  retry: []
}>()

const iconComponent = computed(() => {
  return (icons as Record<string, unknown>)[props.icon] ?? null
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <component
      :is="iconComponent"
      v-if="iconComponent"
      class="size-12 text-destructive"
      :stroke-width="1.5"
    />

    <h3 class="mt-4 text-lg font-medium">
      {{ title }}
    </h3>

    <p class="mt-1 text-sm text-muted-foreground">
      {{ description }}
    </p>

    <div class="mt-6 flex gap-3">
      <Button
        v-if="retryLabel"
        variant="outline"
        @click="emit('retry')"
      >
        {{ retryLabel }}
      </Button>

      <NuxtLink v-if="backLabel && backTo" :to="backTo">
        <Button variant="ghost">{{ backLabel }}</Button>
      </NuxtLink>
    </div>
  </div>
</template>
