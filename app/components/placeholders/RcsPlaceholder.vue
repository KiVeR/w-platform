<script setup lang="ts">
import { MessageCircle } from 'lucide-vue-next'
import FeaturePlaceholder from './FeaturePlaceholder.vue'

defineProps<{
  contentTitle?: string
}>()

const features = [
  'Rich Cards avec images et texte',
  'Carrousels de contenu',
  'Boutons d\'action (URL, appel, localisation)',
  'Réponses suggérées',
]
</script>

<template>
  <FeaturePlaceholder
    :icon="MessageCircle"
    title="Éditeur RCS"
    subtitle="À venir"
    description="Créez des messages riches et interactifs avec des cartes, des carrousels et des boutons d'action."
    :features="features"
  />
</template>
