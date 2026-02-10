<script setup lang="ts">
import { Construction } from 'lucide-vue-next'

defineProps<{
  stepName: string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 py-16 text-center">
    <Construction class="size-12 text-muted-foreground" />
    <div class="space-y-1">
      <h3 class="text-lg font-medium">{{ t('wizard.placeholder.title') }}</h3>
      <p class="text-sm text-muted-foreground">{{ t('wizard.placeholder.description') }}</p>
    </div>
  </div>
</template>
