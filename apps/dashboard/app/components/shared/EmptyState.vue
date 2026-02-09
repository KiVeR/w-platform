<script setup lang="ts">
import { computed } from 'vue'
import * as icons from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  icon: string
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}>()

const emit = defineEmits<{
  action: []
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
      class="size-12 text-muted-foreground"
      :stroke-width="1.5"
    />

    <h3 class="mt-4 text-lg font-medium">
      {{ title }}
    </h3>

    <p class="mt-1 text-sm text-muted-foreground">
      {{ description }}
    </p>

    <NuxtLink v-if="actionLabel && actionTo" :to="actionTo" class="mt-6">
      <Button>{{ actionLabel }}</Button>
    </NuxtLink>

    <Button v-else-if="actionLabel" class="mt-6" @click="emit('action')">
      {{ actionLabel }}
    </Button>
  </div>
</template>
