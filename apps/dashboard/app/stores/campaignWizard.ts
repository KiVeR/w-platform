import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { BarChart3, Megaphone, MessageSquare, LayoutTemplate, Calendar, CheckCircle } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'
import { usePartnerStore } from '@/stores/partner'
import type { CampaignDraft, CampaignEstimate, CampaignLandingPageSummary, WizardStep } from '@/types/campaign'

function createDebouncedFn(fn: () => void | Promise<void>, delay: number): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      timeoutId = null
      void fn()
    }, delay)
  }
}

function freshDraft(): CampaignDraft {
  return {
    type: 'prospection',
    channel: 'sms',
    name: '',
    sender: '',
    message: '',
    targeting: {
      method: 'postcode',
      departments: [],
      postcodes: [],
      communes: [],
      iris_codes: [],
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
  const estimateStale = ref(false)
  const scheduleMode = ref<'now' | 'schedule'>('now')
  const reviewChecks = ref({ messageVerified: false, sendConfirmed: false })
  const showValidation = ref(false)
  const landingPageSummary = ref<CampaignLandingPageSummary | null>(null)
  const landingPageEditorMode = ref<'browse' | 'edit'>('browse')

  const STEPS: WizardStep[] = [
    { key: 'estimate', labelKey: 'wizard.steps.estimate', icon: BarChart3 },
    { key: 'type', labelKey: 'wizard.steps.type', icon: Megaphone },
    { key: 'message', labelKey: 'wizard.steps.message', icon: MessageSquare },
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

  function setLandingPageSummary(summary: CampaignLandingPageSummary | null): void {
    landingPageSummary.value = summary
  }

  function selectLandingPage(summary: CampaignLandingPageSummary): void {
    campaign.value.landing_page_id = summary.id
    landingPageSummary.value = summary
    isDirty.value = true
  }

  function clearLandingPage(): void {
    campaign.value.landing_page_id = null
    landingPageSummary.value = null
    landingPageEditorMode.value = 'browse'
    isDirty.value = true
  }

  function openLandingPageEditor(): void {
    landingPageEditorMode.value = 'edit'
  }

  function closeLandingPageEditor(): void {
    landingPageEditorMode.value = 'browse'
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

  const hasValidTargeting = computed(() => {
    const t = campaign.value.targeting
    if (t.method === 'department') return t.departments.length > 0
    if (t.method === 'postcode') return t.postcodes.length > 0
    if (t.method === 'commune') return t.communes.length > 0
    if (t.method === 'iris') return t.iris_codes.length > 0
    if (t.method === 'address') return !!t.address && t.lat !== null && t.lng !== null && (t.radius ?? 0) >= 1
    return false
  })

  // QW2: Auto-estimate with debounce after targeting changes
  const debouncedEstimate = createDebouncedFn(() => {
    if (hasValidTargeting.value) requestEstimate()
  }, 1500)

  // QW7 + QW2: Mark stale and trigger debounced re-estimate on targeting change
  watch(() => JSON.stringify(campaign.value.targeting), () => {
    if (estimate.value) estimateStale.value = true
    debouncedEstimate()
  })

  function validateStep(stepIndex: number): boolean {
    switch (stepIndex) {
      case 0:
        return true // Estimation is optional/skippable
      case 1:
        return !!campaign.value.type
      case 2:
        return (
          campaign.value.name.trim().length > 0
          && campaign.value.name.length <= 255
          && campaign.value.message.trim().length > 0
          && !isForbiddenMessage(campaign.value.message)
          && /^[a-zA-Z0-9 .\-']{3,11}$/.test(campaign.value.sender)
        )
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

  function targetingForApi() {
    const t = { ...campaign.value.targeting }
    if (t.radius != null) t.radius = t.radius * 1000
    return t
  }

  function campaignBody() {
    const { name, type, channel, message, sender, scheduled_at, is_demo, additional_phone, landing_page_id } = campaign.value
    return {
      name: name || 'Brouillon',
      type,
      channel,
      message,
      sender,
      scheduled_at,
      is_demo,
      additional_phone,
      targeting: targetingForApi(),
      landing_page_id,
      partner_id: partnerStore.effectivePartnerId,
    }
  }

  async function createDraft(): Promise<boolean> {
    return withSaving(async () => {
      const { data, error } = await api.POST('/campaigns', {
        body: campaignBody(),
      } as never)
      if (error || !data) return false
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
      const body: Record<string, unknown> = { targeting: targetingForApi() }
      const partnerId = partnerStore.effectivePartnerId
      if (partnerId) body.partner_id = partnerId
      const { data, error } = await api.POST('/estimate' as never, {
        body,
      } as never)
      if (error || !data) return
      const raw = (data as { data: Record<string, unknown> }).data
      const nextTierRaw = raw.next_tier as { volume_threshold: number, unit_price: number, savings_pct: number } | null
      estimate.value = {
        volume: Number(raw.volume),
        unitPrice: raw.unit_price != null ? Number(raw.unit_price) : null,
        totalPrice: raw.total_price != null ? Number(raw.total_price) : null,
        smsCount: Number(raw.sms_count),
        nextTier: nextTierRaw ? {
          volumeThreshold: nextTierRaw.volume_threshold,
          unitPrice: nextTierRaw.unit_price,
          savingsPercent: nextTierRaw.savings_pct,
        } : null,
      }
      estimateStale.value = false
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

  // QW0: Duplication — pre-fill wizard from existing campaign
  const isPreFilled = ref(false)

  function initFromCampaign(data: { type?: string, channel?: string, targeting?: CampaignDraft['targeting'] | null, landing_page_id?: number | null }): void {
    reset()
    if (data.type) campaign.value.type = data.type as CampaignDraft['type']
    if (data.channel) campaign.value.channel = data.channel as CampaignDraft['channel']
    const targeting = data.targeting ? { ...freshDraft().targeting, ...data.targeting } : freshDraft().targeting
    if (targeting.radius != null) targeting.radius = targeting.radius / 1000
    campaign.value.targeting = targeting
    campaign.value.landing_page_id = data.landing_page_id ?? null
    isPreFilled.value = true
  }

  async function loadDraft(draftId: number): Promise<boolean> {
    const { data, error } = await api.GET('/campaigns/{campaign}', {
      params: {
        path: { campaign: draftId },
        query: { include: 'landingPage' },
      },
    } as never)
    if (error || !data) return false
    const raw = (data as { data: Record<string, unknown> }).data
    reset()
    campaignId.value = Number(raw.id)
    if (raw.type) campaign.value.type = raw.type as CampaignDraft['type']
    if (raw.channel) campaign.value.channel = raw.channel as CampaignDraft['channel']
    if (raw.name) campaign.value.name = raw.name as string
    if (raw.sender) campaign.value.sender = raw.sender as string
    if (raw.message) campaign.value.message = raw.message as string
    if (raw.scheduled_at) campaign.value.scheduled_at = raw.scheduled_at as string
    if (raw.landing_page_id) campaign.value.landing_page_id = raw.landing_page_id as number
    const rawLandingPage = raw.landing_page as Record<string, unknown> | null | undefined
    if (rawLandingPage) {
      landingPageSummary.value = {
        id: Number(rawLandingPage.id),
        name: String(rawLandingPage.name ?? ''),
        status: String(rawLandingPage.status ?? 'draft') as CampaignLandingPageSummary['status'],
      }
    }
    campaign.value.is_demo = !!raw.is_demo
    campaign.value.additional_phone = (raw.additional_phone as string | null) ?? null
    const targeting = raw.targeting ? { ...(raw.targeting as CampaignDraft['targeting']) } : freshDraft().targeting
    if (targeting.radius != null) targeting.radius = targeting.radius / 1000
    campaign.value.targeting = targeting
    isPreFilled.value = true
    return true
  }

  function reset(): void {
    currentStep.value = 0
    campaignId.value = null
    campaign.value = freshDraft()
    isDirty.value = false
    isSaving.value = false
    saveError.value = null
    estimate.value = null
    estimateStale.value = false
    scheduleMode.value = 'now'
    reviewChecks.value = { messageVerified: false, sendConfirmed: false }
    showValidation.value = false
    landingPageSummary.value = null
    landingPageEditorMode.value = 'browse'
    isPreFilled.value = false
  }

  return {
    currentStep,
    campaignId,
    campaign,
    isDirty,
    isSaving,
    saveError,
    estimate,
    estimateStale,
    scheduleMode,
    reviewChecks,
    showValidation,
    landingPageSummary,
    landingPageEditorMode,
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
    hasValidTargeting,
    requestEstimate,
    scheduleCampaign,
    sendCampaign,
    isPreFilled,
    setLandingPageSummary,
    selectLandingPage,
    clearLandingPage,
    openLandingPageEditor,
    closeLandingPageEditor,
    initFromCampaign,
    loadDraft,
    reset,
  }
})
