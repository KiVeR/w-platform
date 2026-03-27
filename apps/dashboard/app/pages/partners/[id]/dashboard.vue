<script setup lang="ts">
import DashboardPage from '@/pages/index.vue'

definePageMeta({ middleware: ['scope-guard'] })
const { ready } = useScopeInit()
</script>

<template>
  <DashboardPage v-if="ready" />
  <div v-else class="flex items-center justify-center h-64">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
</template>
