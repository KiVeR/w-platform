<script setup lang="ts">
import { generateContentName } from '#shared/utils/content'

useHead({ title: 'Nouvelle Landing Page' })

definePageMeta({
  title: 'Nouvelle Landing Page',
  layout: 'editor',
})

const contentStore = useContentStore()
const editorStore = useEditorStore()
const widgetsStore = useWidgetsStore()

onMounted(() => {
  // Reset toast state for new content creation
  resetRenameToastState()

  // Initialize stores for a new content (no API call)
  contentStore.reset()
  contentStore.setMetadata({
    type: 'landing-page',
    // Use auto-generated name that will be shown until first save
    title: generateContentName('landing-page'),
  })

  editorStore.reset()
  widgetsStore.setWidgets([])
})
</script>

<template>
  <div />
</template>
