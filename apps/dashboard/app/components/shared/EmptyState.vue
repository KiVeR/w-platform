<script setup lang="ts">
import type { Component } from 'vue'
import { Button } from '@/components/ui/button'

defineProps<{
  icon?: Component
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <component
      :is="icon"
      v-if="icon"
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
