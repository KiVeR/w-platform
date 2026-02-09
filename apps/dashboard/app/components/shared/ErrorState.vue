<script setup lang="ts">
import { type Component, computed } from 'vue'
import { ServerCrash } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  icon?: Component
  title: string
  description: string
  retryLabel?: string
  backLabel?: string
  backTo?: string
}>(), {
  icon: () => ServerCrash,
})

const resolvedRetryLabel = computed(() => props.retryLabel ?? t('error.retry'))

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <component
      :is="icon"
      v-if="icon"
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
      <Button @click="emit('retry')">
        {{ resolvedRetryLabel }}
      </Button>

      <NuxtLink v-if="backLabel && backTo" :to="backTo">
        <Button variant="ghost">{{ backLabel }}</Button>
      </NuxtLink>
    </div>
  </div>
</template>
