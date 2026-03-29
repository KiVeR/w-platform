<script setup lang="ts">
import { Users } from 'lucide-vue-next'

const { t } = useI18n()
</script>

<template>
  <div
    data-empty-portfolio-state
    class="flex flex-col items-center justify-center py-16 text-center"
  >
    <div class="mb-4 rounded-full bg-muted p-4">
      <Users class="size-8 text-muted-foreground" />
    </div>
    <h2 class="mb-2 text-lg font-semibold">
      {{ t('hub.emptyPortfolio.title') }}
    </h2>
    <p class="max-w-md text-sm text-muted-foreground">
      {{ t('hub.emptyPortfolio.description') }}
    </p>
  </div>
</template>
