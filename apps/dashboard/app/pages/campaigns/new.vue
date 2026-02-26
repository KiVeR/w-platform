<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import CampaignWizard from '@/components/campaigns/wizard/CampaignWizard.vue'

definePageMeta({
  breadcrumbLabel: 'Nouvelle campagne',
})

const wizard = useCampaignWizardStore()
const route = useRoute()
const { t } = useI18n()

onMounted(async () => {
  const draftId = route.query.draft
  if (draftId) {
    const loaded = await wizard.loadDraft(Number(draftId))
    if (loaded) {
      toast.success(t('wizard.draftLoaded'))
    }
  } else if (wizard.isPreFilled) {
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
