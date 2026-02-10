<script setup lang="ts">
import type { ContentType } from '#shared/types/content'
import type { Component } from 'vue'
import { isEditorAvailable } from '#shared/types/content'
import { Globe, MessageCircle, Smartphone } from 'lucide-vue-next'

const props = defineProps<{
  type: ContentType
}>()

const emit = defineEmits<{
  create: [type: ContentType]
}>()

interface TypeConfig {
  icon: Component
  label: string
  description: string
  cta: string
}

const typeConfigs: Record<ContentType, TypeConfig> = {
  'landing-page': {
    icon: Globe,
    label: 'Landing Page',
    description: 'Pages web optimisées pour la conversion',
    cta: 'Créer une landing page',
  },
  'rcs': {
    icon: MessageCircle,
    label: 'Message RCS',
    description: 'Messages riches avec images et boutons',
    cta: 'Découvrir',
  },
  'sms': {
    icon: Smartphone,
    label: 'Campagne SMS',
    description: 'Messages texte directs et efficaces',
    cta: 'Découvrir',
  },
}

const config = computed(() => typeConfigs[props.type])
const isComingSoon = computed(() => !isEditorAvailable(props.type))

function handleClick() {
  emit('create', props.type)
}
</script>

<template>
  <article
    class="type-card"
    tabindex="0"
    role="button"
    :aria-label="`${config.label}: ${config.description}`"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <div class="type-card__icon">
      <component :is="config.icon" :size="32" aria-hidden="true" />
    </div>

    <h3 class="type-card__title">
      {{ config.label }}
      <span v-if="isComingSoon" class="type-card__badge">À venir</span>
    </h3>

    <p class="type-card__description">
      {{ config.description }}
    </p>

    <span class="type-card__cta">
      {{ config.cta }}
      <span class="type-card__arrow" aria-hidden="true">→</span>
    </span>
  </article>
</template>

<style scoped>
.type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6);
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  text-align: center;
  min-width: 220px;
  flex: 1;
}

.type-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.type-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.type-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background-color: var(--color-primary-light, rgba(64, 186, 171, 0.1));
  border-radius: var(--radius-full);
  color: var(--color-primary);
  transition: background-color var(--transition-fast);
}

.type-card:hover .type-card__icon {
  background-color: var(--color-primary-light, rgba(64, 186, 171, 0.15));
}

.type-card__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.type-card__description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.type-card__cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-primary);
  transition: gap var(--transition-fast);
}

.type-card:hover .type-card__cta {
  gap: var(--space-3);
}

.type-card__arrow {
  transition: transform var(--transition-fast);
}

.type-card:hover .type-card__arrow {
  transform: translateX(4px);
}

.type-card__badge {
  padding: 2px 8px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-warning-700);
  background-color: var(--color-warning-100);
  border-radius: var(--radius-sm);
}

/* Responsive */
@media (max-width: 768px) {
  .type-card {
    min-width: 100%;
    padding: var(--space-4);
  }

  .type-card__icon {
    width: 56px;
    height: 56px;
  }
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .type-card,
  .type-card__cta,
  .type-card__arrow,
  .type-card__icon {
    transition: none;
  }

  .type-card:hover {
    transform: none;
  }

  .type-card:hover .type-card__arrow {
    transform: none;
  }
}
</style>
