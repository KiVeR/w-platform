<script setup lang="ts">
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import CampaignWizard from '@/components/campaigns/wizard/CampaignWizard.vue'

definePageMeta({
  breadcrumbLabel: 'Nouvelle campagne',
})

const wizard = useCampaignWizardStore()

onMounted(async () => {
  wizard.reset()
  await wizard.createDraft()
})

onBeforeUnmount(() => {
  wizard.reset()
})
</script>

<template>
  <CampaignWizard />
</template>
