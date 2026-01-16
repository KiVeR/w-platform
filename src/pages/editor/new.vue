<script setup lang="ts">
import EditorLayout from '@/components/layout/EditorLayout.vue'
import { usePersistence } from '@/composables/usePersistence'

definePageMeta({
  title: 'Nouvelle Landing Page',
})

const persistence = usePersistence()

onMounted(() => {
  persistence.initializeNewPage()
  persistence.setupBeforeUnloadGuard()
})
</script>

<template>
  <div class="editor-view">
    <EditorLayout />
  </div>
</template>

<style scoped>
.editor-view {
  width: 100%;
  height: 100vh;
}
</style>
