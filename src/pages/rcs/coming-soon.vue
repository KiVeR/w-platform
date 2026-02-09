<script setup lang="ts">
import { ArrowLeft, MessageCircle } from 'lucide-vue-next'

useHead({ title: 'Éditeur RCS' })

definePageMeta({
  title: 'Éditeur RCS',
})
</script>

<template>
  <div class="coming-soon">
    <div class="coming-soon__card">
      <div class="coming-soon__icon">
        <MessageCircle :size="48" />
      </div>

      <h1 class="coming-soon__title">
        Éditeur RCS
      </h1>

      <p class="coming-soon__subtitle">
        Bientôt disponible
      </p>

      <p class="coming-soon__description">
        L'éditeur de messages RCS est en cours de développement.
        Vous pourrez bientôt créer des messages riches avec images,
        boutons et carrousels interactifs.
      </p>

      <NuxtLink to="/dashboard" class="coming-soon__button">
        <ArrowLeft :size="18" />
        Retour au tableau de bord
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.coming-soon {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background-color: var(--color-background);
}

.coming-soon__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 400px;
  padding: var(--space-8);
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.coming-soon__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  margin-bottom: var(--space-4);
  background-color: var(--color-primary-light, rgba(64, 186, 171, 0.1));
  border-radius: var(--radius-full);
  color: var(--color-primary);
}

.coming-soon__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
}

.coming-soon__subtitle {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--color-primary);
  margin: 0 0 var(--space-4);
}

.coming-soon__description {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 var(--space-6);
}

.coming-soon__button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background-color var(--transition-fast);
}

.coming-soon__button:hover {
  background-color: var(--color-primary-dark);
}

.coming-soon__button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
