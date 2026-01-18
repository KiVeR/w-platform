<script setup lang="ts">
import { usePersistence } from '@/composables/usePersistence'

definePageMeta({
  title: 'Nouvelle Landing Page',
  layout: 'editor',
})

const persistence = usePersistence()

onMounted(() => {
  persistence.initializeNewPage()
  persistence.setupBeforeUnloadGuard()
})
</script>

<template>
  <div>
    <!-- No page-specific overlays for new page -->
  </div>
</template>
