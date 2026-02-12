<script setup lang="ts">
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import CampaignWizard from '@/components/campaigns/wizard/CampaignWizard.vue'

definePageMeta({
  breadcrumbLabel: 'Nouvelle campagne',
})

const wizard = useCampaignWizardStore()

onMounted(() => {
  if (wizard.isPreFilled) {
    wizard.isPreFilled = false
  } else {
    wizard.reset()
  }
})

onBeforeUnmount(() => {
  wizard.reset()
})
</script>

<template>
  <CampaignWizard />
</template>
