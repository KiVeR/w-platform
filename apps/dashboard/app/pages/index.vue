<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-foreground">
        {{ t('app.title') }}
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">
        {{ t('app.description') }}
      </p>
    </div>
  </div>
</template>
