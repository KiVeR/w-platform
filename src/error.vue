<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{
  error: {
    statusCode: number
    message: string
  }
}>()

useHead({ title: `Erreur ${props.error.statusCode}` })

function handleBack() {
  clearError({ redirect: '/dashboard' })
}
</script>

<template>
  <div class="error-page">
    <div class="error-card">
      <AlertTriangle :size="48" class="error-icon" />
      <h1 class="error-code">
        {{ error.statusCode }}
      </h1>
      <p class="error-message">
        {{ error.statusCode === 404 ? 'Page introuvable' : error.message }}
      </p>
      <button class="back-btn" @click="handleBack">
        Retour au dashboard
      </button>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background, #f8fafc);
  font-family: 'Inter', sans-serif;
}

.error-card {
  text-align: center;
  padding: 48px;
  max-width: 420px;
}

.error-icon {
  color: var(--color-error, #ef4444);
  margin-bottom: 16px;
}

.error-code {
  font-size: 72px;
  font-weight: 700;
  color: var(--color-text, #1e293b);
  margin: 0 0 8px;
  line-height: 1;
}

.error-message {
  font-size: 16px;
  color: var(--color-text-secondary, #64748b);
  margin: 0 0 32px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  background-color: var(--color-primary, #3b82f6);
  color: white;
  border: none;
  border-radius: var(--radius-lg, 8px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.back-btn:hover {
  background-color: var(--color-primary-600, #2563eb);
}
</style>
