<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-foreground">
      {{ t('app.title') }}
    </h1>
    <p class="mt-1 text-sm text-muted-foreground">
      {{ t('app.description') }}
    </p>
  </div>
</template>
