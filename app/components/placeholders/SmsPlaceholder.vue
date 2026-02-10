<script setup lang="ts">
import { Smartphone } from 'lucide-vue-next'
import FeaturePlaceholder from './FeaturePlaceholder.vue'

defineProps<{
  contentTitle?: string
}>()

const features = [
  'Compteur de caractères en temps réel',
  'Calcul automatique du nombre de segments',
  'Détection de l\'encodage (GSM-7 / UCS-2)',
  'Variables de personnalisation',
]
</script>

<template>
  <FeaturePlaceholder
    :icon="Smartphone"
    title="Éditeur SMS"
    subtitle="À venir"
    description="Créez des campagnes SMS efficaces avec compteur de caractères et gestion des variables de personnalisation."
    :features="features"
  />
</template>
