<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-foreground">
      {{ t('dashboard.welcome', { firstname: auth.user?.firstname ?? '' }) }}
    </h1>
    <p class="mt-1 text-sm text-muted-foreground">
      {{ t('dashboard.description') }}
    </p>
  </div>
</template>
