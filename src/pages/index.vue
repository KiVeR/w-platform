<script setup lang="ts">
// Redirect to editor for now
// Will be replaced by dashboard after auth implementation
definePageMeta({
  title: 'Kreo',
})

navigateTo('/editor/1')
</script>

<template>
  <div class="flex h-screen items-center justify-center">
    <p class="text-slate-500">
      Redirection...
    </p>
  </div>
</template>
