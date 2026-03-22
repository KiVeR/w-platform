<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useCampaignWizardStore } from '@/stores/campaignWizard'
import { useAuthStore } from '@/stores/auth'
import { usePartnerStore } from '@/stores/partner'
import CampaignWizard from '@/components/campaigns/wizard/CampaignWizard.vue'

definePageMeta({
  breadcrumbLabel: 'Nouvelle campagne',
})

const wizard = useCampaignWizardStore()
const auth = useAuthStore()
const partner = usePartnerStore()
const api = useApi()
const route = useRoute()
const { t } = useI18n()

async function scopePartnerById(partnerId: number): Promise<void> {
  const { data, error } = await api.GET('/partners/{partner}', {
    params: { path: { partner: partnerId } },
  } as never)

  if (error || !data)
    return

  const raw = (data as { data: { id: number, name: string } }).data
  partner.setPartner(Number(raw.id), String(raw.name))
}

async function ensureCampaignPartnerContext(): Promise<void> {
  if (!auth.isAdmin || partner.currentPartnerId !== null)
    return

  const requestedPartnerId = Number(route.query.partner)
  if (Number.isFinite(requestedPartnerId) && requestedPartnerId > 0) {
    await scopePartnerById(requestedPartnerId)
    return
  }

  const { data, error } = await api.GET('/partners', {
    params: {
      query: {
        'fields[partners]': 'id,name',
        per_page: 2,
      } as never,
    },
  } as never)

  if (error || !data)
    return

  const items = ((data as { data: Array<{ id: number, name: string }> }).data ?? [])
  const [singlePartner] = items
  if (items.length === 1 && singlePartner) {
    partner.setPartner(Number(singlePartner.id), String(singlePartner.name))
  }
}

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
    await ensureCampaignPartnerContext()
  }
})

onBeforeUnmount(() => {
  wizard.reset()
})
</script>

<template>
  <CampaignWizard />
</template>
