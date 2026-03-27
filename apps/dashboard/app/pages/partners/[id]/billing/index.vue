<script setup lang="ts">
import BillingPage from '@/pages/billing/index.vue'

definePageMeta({ middleware: ['scope-guard'] })
const { ready } = useScopeInit()
</script>

<template>
  <BillingPage v-if="ready" />
  <div v-else class="flex items-center justify-center h-64">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
</template>
