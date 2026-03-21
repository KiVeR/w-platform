<script setup lang="ts">
definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['view operations'],
})
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold">
      {{ $t('nav.billing') }}
    </h1>
    <p class="mt-2 text-muted-foreground">
      Coming soon.
    </p>
  </div>
</template>
