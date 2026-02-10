import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Megaphone, MessageSquare, MapPin, LayoutTemplate, Calendar, CheckCircle } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'
import { isForbiddenMessage } from '@/utils/sms'
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
    },
    scheduled_at: null,
    landing_page_id: null,
    is_demo: false,
    additional_phone: null,
  }
}

export const useCampaignWizardStore = defineStore('campaignWizard', () => {
  const api = useApi()

  const currentStep = ref(0)
  const campaignId = ref<number | null>(null)
  const campaign = ref<CampaignDraft>(freshDraft())
  const isDirty = ref(false)
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)
  const estimate = ref<CampaignEstimate | null>(null)
  const scheduleMode = ref<'now' | 'schedule'>('now')
  const reviewChecks = ref({ messageVerified: false, sendConfirmed: false })

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
    if (step >= 0 && step <= 5) currentStep.value = step
  }

  function nextStep(): void {
    if (currentStep.value < 5) currentStep.value++
  }

  function prevStep(): void {
    if (currentStep.value > 0) currentStep.value--
  }

  function validateCurrentStep(): boolean {
    switch (currentStep.value) {
      case 0:
        return !!campaign.value.type
      case 1:
        return (
          campaign.value.name.trim().length > 0
          && campaign.value.name.length <= 255
          && campaign.value.message.trim().length > 0
          && !isForbiddenMessage(campaign.value.message)
          && (campaign.value.sender === '' || /^[a-zA-Z0-9 .\-']{1,11}$/.test(campaign.value.sender))
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

  async function createDraft(): Promise<boolean> {
    return withSaving(async () => {
      const { data, error } = await api.POST('/campaigns', {} as never)
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
      const { name, type, channel, message, sender, scheduled_at, is_demo, additional_phone, targeting } = campaign.value
      const { error } = await api.PUT('/campaigns/{campaign}', {
        ...campaignPath(),
        body: { name, type, channel, message, sender, scheduled_at, is_demo, additional_phone, targeting },
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
    if (!campaignId.value) return
    try {
      const { data, error } = await api.POST('/campaigns/{campaign}/estimate', campaignPath() as never)
      if (error || !data) return
      const raw = (data as { data: Record<string, string> }).data
      estimate.value = {
        volume: Number(raw.volume),
        unitPrice: Number(raw.unit_price),
        totalPrice: Number(raw.total_price),
        smsCount: Number(raw.sms_count),
      }
    }
    catch {
      // Error toast handled by apiMiddleware
    }
  }

  async function scheduleCampaign(): Promise<boolean> {
    if (!campaignId.value) return false
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
    if (!campaignId.value) return false
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
    STEPS,
    goToStep,
    nextStep,
    prevStep,
    validateCurrentStep,
    createDraft,
    saveDraft,
    requestEstimate,
    scheduleCampaign,
    sendCampaign,
    reset,
  }
})
