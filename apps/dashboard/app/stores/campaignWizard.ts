import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { Megaphone, MessageSquare, MapPin, LayoutTemplate, Calendar, CheckCircle } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'
import { usePartnerStore } from '@/stores/partner'
import type { CampaignDraft, CampaignEstimate, WizardStep } from '@/types/campaign'

function freshDraft(): CampaignDraft {
  return {
    type: 'prospection',
    channel: 'sms',
    name: '',
    sender: '',
    message: '',
    targeting: {
      method: 'department',
      departments: [],
      postcodes: [],
      address: null,
      lat: null,
      lng: null,
      radius: null,
      gender: null,
      age_min: null,
      age_max: null,
    },
    scheduled_at: null,
    landing_page_id: null,
    is_demo: false,
    additional_phone: null,
  }
}

export const useCampaignWizardStore = defineStore('campaignWizard', () => {
  const api = useApi()
  const partnerStore = usePartnerStore()

  const currentStep = ref(0)
  const campaignId = ref<number | null>(null)
  const campaign = ref<CampaignDraft>(freshDraft())
  const isDirty = ref(false)
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)
  const estimate = ref<CampaignEstimate | null>(null)
  const scheduleMode = ref<'now' | 'schedule'>('now')
  const reviewChecks = ref({ messageVerified: false, sendConfirmed: false })
  const showValidation = ref(false)

  const STEPS: WizardStep[] = [
    { key: 'type', labelKey: 'wizard.steps.type', icon: Megaphone },
    { key: 'message', labelKey: 'wizard.steps.message', icon: MessageSquare },
    { key: 'targeting', labelKey: 'wizard.steps.targeting', icon: MapPin },
    { key: 'landing-page', labelKey: 'wizard.steps.landingPage', icon: LayoutTemplate },
    { key: 'schedule', labelKey: 'wizard.steps.schedule', icon: Calendar },
    { key: 'review', labelKey: 'wizard.steps.review', icon: CheckCircle },
  ]

  async function withSaving<T>(fn: () => Promise<T>, fallback: T, onError?: () => void): Promise<T> {
    isSaving.value = true
    try {
      return await fn()
    }
    catch {
      onError?.()
      return fallback
    }
    finally {
      isSaving.value = false
    }
  }

  function campaignPath(): { params: { path: { campaign: number } } } {
    return { params: { path: { campaign: campaignId.value! } } }
  }

  function goToStep(step: number): void {
    if (step >= 0 && step <= 5) {
      currentStep.value = step
      showValidation.value = false
    }
  }

  function nextStep(): void {
    if (currentStep.value < 5) currentStep.value++
  }

  function prevStep(): void {
    if (currentStep.value > 0) currentStep.value--
  }

  function validateStep(stepIndex: number): boolean {
    switch (stepIndex) {
      case 0:
        return !!campaign.value.type
      case 1:
        return (
          campaign.value.name.trim().length > 0
          && campaign.value.name.length <= 255
          && campaign.value.message.trim().length > 0
          && !isForbiddenMessage(campaign.value.message)
          && /^[a-zA-Z0-9 .\-']{3,11}$/.test(campaign.value.sender)
        )
      case 2: {
        const t = campaign.value.targeting
        if (t.method === 'department') return t.departments.length > 0
        if (t.method === 'postcode') return t.postcodes.length > 0
        if (t.method === 'address') return t.address !== null && t.lat !== null && t.lng !== null && (t.radius ?? 0) >= 1
        return false
      }
      case 3:
        return true
      case 4:
        if (scheduleMode.value === 'now') return true
        return campaign.value.scheduled_at !== null
      default:
        return true
    }
  }

  function validateCurrentStep(): boolean {
    const valid = validateStep(currentStep.value)
    if (!valid) showValidation.value = true
    return valid
  }

  const stepValidation = computed(() => STEPS.map((_, i) => validateStep(i)))

  function campaignBody() {
    const { name, type, channel, message, sender, scheduled_at, is_demo, additional_phone, targeting, landing_page_id } = campaign.value
    return {
      name: name || 'Brouillon',
      type,
      channel,
      message,
      sender,
      scheduled_at,
      is_demo,
      additional_phone,
      targeting,
      landing_page_id,
      partner_id: partnerStore.effectivePartnerId,
    }
  }

  async function createDraft(): Promise<boolean> {
    return withSaving(async () => {
      const { data, error } = await api.POST('/campaigns', {
        body: campaignBody(),
      } as never)
      if (error) return false
      const raw = data as { data: { id: string } }
      campaignId.value = Number(raw.data.id)
      return true
    }, false)
  }

  async function saveDraft(): Promise<boolean> {
    if (!campaignId.value) return false
    saveError.value = null
    return withSaving(async () => {
      const { error } = await api.PUT('/campaigns/{campaign}', {
        ...campaignPath(),
        body: campaignBody(),
      } as never)
      if (error) {
        saveError.value = 'save_failed'
        return false
      }
      isDirty.value = false
      return true
    }, false, () => { saveError.value = 'save_failed' })
  }

  async function requestEstimate(): Promise<void> {
    try {
      const body: Record<string, unknown> = { targeting: campaign.value.targeting }
      const partnerId = partnerStore.effectivePartnerId
      if (partnerId) body.partner_id = partnerId
      const { data, error } = await api.POST('/estimate' as never, {
        body,
      } as never)
      if (error || !data) return
      const raw = (data as { data: Record<string, string | null> }).data
      estimate.value = {
        volume: Number(raw.volume),
        unitPrice: raw.unit_price != null ? Number(raw.unit_price) : null,
        totalPrice: raw.total_price != null ? Number(raw.total_price) : null,
        smsCount: Number(raw.sms_count),
      }
    }
    catch {
      // Error toast handled by apiMiddleware
    }
  }

  async function ensureDraft(): Promise<boolean> {
    if (campaignId.value) return true
    return createDraft()
  }

  async function scheduleCampaign(): Promise<boolean> {
    if (!await ensureDraft()) return false
    await saveDraft()
    try {
      const { error } = await api.POST('/campaigns/{campaign}/schedule', {
        ...campaignPath(),
        body: { scheduled_at: campaign.value.scheduled_at },
      } as never)
      return !error
    }
    catch {
      return false
    }
  }

  async function sendCampaign(): Promise<boolean> {
    if (!await ensureDraft()) return false
    await saveDraft()
    try {
      const { error } = await api.POST('/campaigns/{campaign}/send', campaignPath() as never)
      return !error
    }
    catch {
      return false
    }
  }

  function reset(): void {
    currentStep.value = 0
    campaignId.value = null
    campaign.value = freshDraft()
    isDirty.value = false
    isSaving.value = false
    saveError.value = null
    estimate.value = null
    scheduleMode.value = 'now'
    reviewChecks.value = { messageVerified: false, sendConfirmed: false }
    showValidation.value = false
  }

  return {
    currentStep,
    campaignId,
    campaign,
    isDirty,
    isSaving,
    saveError,
    estimate,
    scheduleMode,
    reviewChecks,
    showValidation,
    STEPS,
    goToStep,
    nextStep,
    prevStep,
    validateStep,
    validateCurrentStep,
    stepValidation,
    createDraft,
    saveDraft,
    ensureDraft,
    requestEstimate,
    scheduleCampaign,
    sendCampaign,
    reset,
  }
})
