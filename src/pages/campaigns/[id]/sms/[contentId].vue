<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import SmsPlaceholder from '@/components/placeholders/SmsPlaceholder.vue'

definePageMeta({
  title: 'Éditeur SMS',
})

const route = useRoute()
const campaignId = computed(() => route.params.id)
const _contentId = computed(() => route.params.contentId)
</script>

<template>
  <div class="editor-page">
    <header class="editor-header">
      <NuxtLink :to="`/campaigns/${campaignId}`" class="back-link">
        <ArrowLeft :size="20" />
        Retour à la campagne
      </NuxtLink>
      <h1 class="editor-title">
        Message SMS
      </h1>
    </header>
    <main class="editor-content">
      <SmsPlaceholder />
    </main>
  </div>
</template>

<style scoped>
.editor-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
}

.editor-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-text);
}

.editor-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.editor-content {
  flex: 1;
  display: flex;
}
</style>
