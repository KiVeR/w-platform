<script setup lang="ts">
import type { ContentType } from '#shared/types/content'
import { Sparkles } from 'lucide-vue-next'
import ContentTypeCard from './ContentTypeCard.vue'

defineProps<{
  userName?: string
}>()

const emit = defineEmits<{
  create: [type: ContentType]
}>()

const contentTypes: ContentType[] = ['landing-page', 'rcs', 'sms']

function handleCreate(type: ContentType) {
  emit('create', type)
}
</script>

<template>
  <div class="empty-dashboard">
    <!-- Hero section -->
    <section class="hero" aria-labelledby="welcome-heading">
      <div class="hero__illustration" aria-hidden="true">
        <Sparkles :size="64" />
      </div>

      <h1 id="welcome-heading" class="hero__title">
        <template v-if="userName">
          Bienvenue, {{ userName }} !
        </template>
        <template v-else>
          Bienvenue sur Kreo
        </template>
      </h1>

      <p class="hero__subtitle">
        Créez des landing pages, messages RCS et campagnes SMS en quelques minutes
      </p>
    </section>

    <!-- Content type selection -->
    <section class="type-selection" aria-labelledby="type-selection-heading">
      <h2 id="type-selection-heading" class="type-selection__title">
        Choisissez votre type de contenu
      </h2>

      <div class="type-selection__cards">
        <ContentTypeCard
          v-for="type in contentTypes"
          :key="type"
          :type="type"
          @create="handleCreate"
        />
      </div>
    </section>

    <!-- Optional: Templates link (can be enabled later)
    <section class="templates-section">
      <div class="templates-divider">
        <span>ou</span>
      </div>
      <button class="templates-link">
        Explorer les templates
      </button>
    </section>
    -->
  </div>
</template>

<style scoped>
.empty-dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-10);
  padding: var(--space-8) var(--space-4);
  max-width: 900px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
}

/* Hero section */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-4);
}

.hero__illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, var(--color-primary-light, rgba(64, 186, 171, 0.1)) 0%, var(--color-primary-light, rgba(64, 186, 171, 0.05)) 100%);
  border-radius: var(--radius-full);
  color: var(--color-primary);
  animation: float 3s ease-in-out infinite;
}

.hero__title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.hero__subtitle {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 480px;
  line-height: 1.6;
}

/* Type selection section */
.type-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  width: 100%;
}

.type-selection__title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.type-selection__cards {
  display: flex;
  gap: var(--space-4);
  width: 100%;
  justify-content: center;
}

.type-selection__cards > * {
  animation: slideUp 0.4s ease-out backwards;
}

.type-selection__cards > *:nth-child(1) { animation-delay: 0.1s; }
.type-selection__cards > *:nth-child(2) { animation-delay: 0.2s; }
.type-selection__cards > *:nth-child(3) { animation-delay: 0.3s; }

/* Templates section (optional, commented out in template) */
.templates-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.templates-divider {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: 200px;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.templates-divider::before,
.templates-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: var(--color-border);
}

.templates-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.templates-link:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .empty-dashboard {
    gap: var(--space-8);
    padding: var(--space-6) var(--space-4);
  }

  .hero__illustration {
    width: 100px;
    height: 100px;
  }

  .hero__title {
    font-size: var(--text-2xl);
  }

  .hero__subtitle {
    font-size: var(--text-base);
  }

  .type-selection__cards {
    flex-direction: column;
    align-items: stretch;
  }
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .empty-dashboard,
  .type-selection__cards > *,
  .hero__illustration {
    animation: none;
  }
}
</style>
