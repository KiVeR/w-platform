<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  title: string
  subtitle?: string
  description: string
  features: string[]
}>()
</script>

<template>
  <div class="placeholder-container">
    <div class="placeholder-content">
      <div class="placeholder-icon">
        <component :is="icon" :size="48" class="icon" />
      </div>
      <h2 class="placeholder-title">
        {{ title }}
      </h2>
      <p v-if="subtitle" class="placeholder-subtitle">
        {{ subtitle }}
      </p>
      <p class="placeholder-description">
        {{ description }}
      </p>
      <ul class="placeholder-features">
        <li v-for="feature in features" :key="feature">
          {{ feature }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.placeholder-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: var(--space-8);
  background-color: var(--color-background);
}

.placeholder-content {
  text-align: center;
  max-width: 400px;
}

.placeholder-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  margin-bottom: var(--space-6);
  background-color: var(--color-primary-50);
  border-radius: var(--radius-full);
}

.placeholder-icon .icon {
  color: var(--color-primary);
}

.placeholder-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2) 0;
}

.placeholder-subtitle {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-warning-700);
  background-color: var(--color-warning-100);
  border-radius: var(--radius-full);
}

.placeholder-description {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: var(--space-6);
}

.placeholder-features {
  text-align: left;
  padding: var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  list-style: none;
  margin: 0;
}

.placeholder-features li {
  display: flex;
  align-items: center;
  padding: var(--space-2) 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.placeholder-features li::before {
  content: '✓';
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: var(--space-3);
  font-size: 12px;
  color: var(--color-primary);
  background-color: var(--color-primary-50);
  border-radius: var(--radius-full);
}

.placeholder-features li + li {
  border-top: 1px solid var(--color-border);
}
</style>
