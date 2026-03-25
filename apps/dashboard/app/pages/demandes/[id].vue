<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({
  middleware: ['role-guard'],
  requiredPermissions: ['view demandes'],
  layout: 'default',
})

const { t } = useI18n()
const route = useRoute()
const { scopedRoute } = useScopedNavigation()
const demandeId = computed(() => Number(route.params.id))
const { demande, isLoading, hasError, refreshDemande } = useDemandeDetail(demandeId)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <NuxtLink :to="scopedRoute('/demandes')" class="text-sm text-muted-foreground hover:underline">
          {{ t('demandes.list.title') }}
        </NuxtLink>
        <h1 class="text-2xl font-bold">
          {{ demande?.ref_demande ?? '...' }}
        </h1>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-32 bg-muted animate-pulse rounded-lg" />
    </div>

    <!-- Error -->
    <div v-else-if="hasError" class="text-center py-12">
      <p class="text-muted-foreground mb-4">{{ t('error.404.title') }}</p>
      <Button @click="refreshDemande">{{ t('error.retry') }}</Button>
    </div>

    <!-- Hub layout 2 panneaux -->
    <div v-else-if="demande" class="grid gap-6 md:grid-cols-[1fr_2fr]">
      <!-- Panneau gauche: résumé + timeline -->
      <div class="space-y-6">
        <DemandeFormCard :demande="demande" @updated="refreshDemande" />
        <DemandeTimeline :operations="demande.operations ?? []" />
      </div>

      <!-- Panneau droit: opérations (DemandeDetailHub sera ajouté au step 4.4) -->
      <div class="space-y-4">
        <DemandeDetailHub :demande="demande" @refresh="refreshDemande" />
      </div>
    </div>
  </div>
</template>
