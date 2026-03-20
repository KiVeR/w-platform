import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'

const mockPost = vi.fn()
const mockPut = vi.fn()
const mockGet = vi.fn()

stubAuthGlobals({ $api: { POST: mockPost, PUT: mockPut, GET: mockGet } })
vi.stubGlobal('isForbiddenMessage', (msg: string) => msg.toLowerCase().includes('rsms.co'))

vi.mock('@/stores/partner', () => ({
  usePartnerStore: () => ({
    effectivePartnerId: 42,
  }),
}))

const { useCampaignWizardStore } = await import('@/stores/campaignWizard')

describe('useCampaignWizardStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  describe('init state', () => {
    it('has correct default values', () => {
      const wizard = useCampaignWizardStore()

      expect(wizard.currentStep).toBe(0)
      expect(wizard.campaignId).toBeNull()
      expect(wizard.campaign.type).toBe('prospection')
      expect(wizard.campaign.channel).toBe('sms')
      expect(wizard.campaign.name).toBe('')
      expect(wizard.campaign.sender).toBe('')
      expect(wizard.campaign.message).toBe('')
      expect(wizard.campaign.scheduled_at).toBeNull()
      expect(wizard.campaign.landing_page_id).toBeNull()
      expect(wizard.campaign.is_demo).toBe(false)
      expect(wizard.isDirty).toBe(false)
      expect(wizard.isSaving).toBe(false)
    })
  })

  describe('navigation', () => {
    it('goToStep sets currentStep within bounds', () => {
      const wizard = useCampaignWizardStore()

      wizard.goToStep(3)
      expect(wizard.currentStep).toBe(3)

      wizard.goToStep(-1)
      expect(wizard.currentStep).toBe(3)

      wizard.goToStep(6)
      expect(wizard.currentStep).toBe(3)
    })

    it('nextStep increments and caps at 5', () => {
      const wizard = useCampaignWizardStore()

      wizard.nextStep()
      expect(wizard.currentStep).toBe(1)

      wizard.goToStep(5)
      wizard.nextStep()
      expect(wizard.currentStep).toBe(5)
    })

    it('prevStep decrements and caps at 0', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(2)

      wizard.prevStep()
      expect(wizard.currentStep).toBe(1)

      wizard.prevStep()
      wizard.prevStep()
      expect(wizard.currentStep).toBe(0)
    })
  })

  describe('landing page helpers', () => {
    it('selectLandingPage stores summary and marks draft dirty', () => {
      const wizard = useCampaignWizardStore()

      wizard.selectLandingPage({ id: 12, name: 'LP inline', status: 'draft' })

      expect(wizard.campaign.landing_page_id).toBe(12)
      expect(wizard.landingPageSummary).toEqual({ id: 12, name: 'LP inline', status: 'draft' })
      expect(wizard.isDirty).toBe(true)
    })

    it('clearLandingPage clears link, summary and closes editor mode', () => {
      const wizard = useCampaignWizardStore()

      wizard.selectLandingPage({ id: 12, name: 'LP inline', status: 'draft' })
      wizard.openLandingPageEditor()
      wizard.clearLandingPage()

      expect(wizard.campaign.landing_page_id).toBeNull()
      expect(wizard.landingPageSummary).toBeNull()
      expect(wizard.landingPageEditorMode).toBe('browse')
    })
  })

  describe('validation', () => {
    it('step 0 (estimate) always returns true', () => {
      const wizard = useCampaignWizardStore()
      expect(wizard.validateCurrentStep()).toBe(true)
    })

    it('step 1 (type) returns true (type always set)', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(1)
      expect(wizard.validateCurrentStep()).toBe(true)
    })

    it('step 2: returns false if name empty', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(2)
      wizard.campaign.name = ''
      wizard.campaign.message = 'Hello'
      expect(wizard.validateCurrentStep()).toBe(false)
    })

    it('step 2: returns false if message empty', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(2)
      wizard.campaign.name = 'Test'
      wizard.campaign.message = ''
      expect(wizard.validateCurrentStep()).toBe(false)
    })

    it('step 2: returns false if forbidden domain in message', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(2)
      wizard.campaign.name = 'Test'
      wizard.campaign.message = 'Visit rsms.co'
      expect(wizard.validateCurrentStep()).toBe(false)
    })

    it('step 2: returns false if sender empty', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(2)
      wizard.campaign.name = 'Test'
      wizard.campaign.message = 'Hello'
      wizard.campaign.sender = ''
      expect(wizard.validateCurrentStep()).toBe(false)
    })

    it('step 2: returns false if sender too short', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(2)
      wizard.campaign.name = 'Test'
      wizard.campaign.message = 'Hello'
      wizard.campaign.sender = 'AB'
      expect(wizard.validateCurrentStep()).toBe(false)
    })

    it('step 2: returns true for valid name + message + sender', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(2)
      wizard.campaign.name = 'Promo'
      wizard.campaign.message = 'Bonjour'
      wizard.campaign.sender = 'WELLPACK'
      expect(wizard.validateCurrentStep()).toBe(true)
    })

    it('step 3: always returns true (LP optional)', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(3)
      expect(wizard.validateCurrentStep()).toBe(true)
    })

    it('validateStep 4 (schedule) returns false if scheduled_at null and mode schedule', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(4)
      wizard.scheduleMode = 'schedule'
      wizard.campaign.scheduled_at = null

      expect(wizard.validateCurrentStep()).toBe(false)
    })

    it('validateStep 4 (schedule) returns true if mode now', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(4)
      wizard.scheduleMode = 'now'

      expect(wizard.validateCurrentStep()).toBe(true)
    })
  })

  describe('hasValidTargeting', () => {
    it('returns false when departments empty', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.method = 'department'
      wizard.campaign.targeting.departments = []
      expect(wizard.hasValidTargeting).toBe(false)
    })

    it('returns true with departments selected', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.method = 'department'
      wizard.campaign.targeting.departments = ['75']
      expect(wizard.hasValidTargeting).toBe(true)
    })

    it('returns false when postcodes empty', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.method = 'postcode'
      wizard.campaign.targeting.postcodes = []
      expect(wizard.hasValidTargeting).toBe(false)
    })

    it('returns true with postcodes', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.method = 'postcode'
      wizard.campaign.targeting.postcodes = ['75001']
      expect(wizard.hasValidTargeting).toBe(true)
    })

    it('returns true with full address data', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.method = 'address'
      wizard.campaign.targeting.address = 'Paris'
      wizard.campaign.targeting.lat = 48.86
      wizard.campaign.targeting.lng = 2.34
      wizard.campaign.targeting.radius = 10
      expect(wizard.hasValidTargeting).toBe(true)
    })

    it('returns false with incomplete address', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.method = 'address'
      wizard.campaign.targeting.address = 'Paris'
      wizard.campaign.targeting.lat = null
      expect(wizard.hasValidTargeting).toBe(false)
    })

    it('returns false with radius < 1', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.method = 'address'
      wizard.campaign.targeting.address = 'Paris'
      wizard.campaign.targeting.lat = 48.86
      wizard.campaign.targeting.lng = 2.34
      wizard.campaign.targeting.radius = 0
      expect(wizard.hasValidTargeting).toBe(false)
    })

    it('returns false when communes empty', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.method = 'commune'
      wizard.campaign.targeting.communes = []
      expect(wizard.hasValidTargeting).toBe(false)
    })

    it('returns true with communes selected', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.method = 'commune'
      wizard.campaign.targeting.communes = ['17109']
      expect(wizard.hasValidTargeting).toBe(true)
    })

    it('returns false when iris_codes empty', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.method = 'iris'
      wizard.campaign.targeting.iris_codes = []
      expect(wizard.hasValidTargeting).toBe(false)
    })

    it('returns true with iris_codes selected', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.method = 'iris'
      wizard.campaign.targeting.iris_codes = ['751040101']
      expect(wizard.hasValidTargeting).toBe(true)
    })
  })

  describe('API actions', () => {
    it('createDraft calls POST /campaigns and sets campaignId', async () => {
      mockPost.mockResolvedValue({ data: { data: { id: '99' } }, error: null })

      const wizard = useCampaignWizardStore()
      const result = await wizard.createDraft()

      expect(mockPost).toHaveBeenCalledWith('/campaigns', expect.anything())
      expect(wizard.campaignId).toBe(99)
      expect(result).toBe(true)
    })

    it('saveDraft calls PUT /campaigns/{id} with campaign data', async () => {
      mockPut.mockResolvedValue({ data: {}, error: null })

      const wizard = useCampaignWizardStore()
      wizard.campaignId = 99
      wizard.campaign.name = 'Test Campaign'
      wizard.isDirty = true

      const result = await wizard.saveDraft()

      expect(mockPut).toHaveBeenCalledWith('/campaigns/{campaign}', expect.objectContaining({
        params: { path: { campaign: 99 } },
      }))
      expect(wizard.isDirty).toBe(false)
      expect(result).toBe(true)
    })

    it('saveDraft skips if no campaignId', async () => {
      const wizard = useCampaignWizardStore()
      const result = await wizard.saveDraft()

      expect(mockPut).not.toHaveBeenCalled()
      expect(result).toBe(false)
    })

    it('requestEstimate calls POST /estimate with targeting and partner_id', async () => {
      mockPost.mockResolvedValue({
        data: { data: { volume: '1000', unit_price: '0.045', total_price: '45.00', sms_count: '1' } },
        error: null,
      })

      const wizard = useCampaignWizardStore()

      await wizard.requestEstimate()

      expect(mockPost).toHaveBeenCalledWith('/estimate', expect.objectContaining({
        body: { targeting: wizard.campaign.targeting, partner_id: 42 },
      }))
      expect(wizard.estimate).toEqual({
        volume: 1000,
        unitPrice: 0.045,
        totalPrice: 45,
        smsCount: 1,
        nextTier: null,
      })
    })

    it('scheduleCampaign calls POST /campaigns/{id}/schedule', async () => {
      mockPost.mockResolvedValue({ data: {}, error: null })

      const wizard = useCampaignWizardStore()
      wizard.campaignId = 99
      wizard.campaign.scheduled_at = '2026-03-01T10:00:00Z'

      const result = await wizard.scheduleCampaign()

      expect(mockPost).toHaveBeenCalledWith('/campaigns/{campaign}/schedule', expect.objectContaining({
        params: { path: { campaign: 99 } },
        body: { scheduled_at: '2026-03-01T10:00:00Z' },
      }))
      expect(result).toBe(true)
    })

    it('sendCampaign calls POST /campaigns/{id}/send', async () => {
      mockPost.mockResolvedValue({ data: {}, error: null })

      const wizard = useCampaignWizardStore()
      wizard.campaignId = 99

      const result = await wizard.sendCampaign()

      expect(mockPost).toHaveBeenCalledWith('/campaigns/{campaign}/send', expect.objectContaining({
        params: { path: { campaign: 99 } },
      }))
      expect(result).toBe(true)
    })
  })

  describe('validateStep', () => {
    it('validateStep(0) always returns true (estimate optional)', () => {
      const wizard = useCampaignWizardStore()
      expect(wizard.validateStep(0)).toBe(true)
    })

    it('validateStep(1) returns true (type always set)', () => {
      const wizard = useCampaignWizardStore()
      expect(wizard.validateStep(1)).toBe(true)
    })

    it('validateStep(2) returns false if name empty', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaign.name = ''
      wizard.campaign.message = 'Hello'
      expect(wizard.validateStep(2)).toBe(false)
    })

    it('validateStep works independently of currentStep', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(0)
      wizard.campaign.name = 'Test'
      wizard.campaign.message = 'Hello'
      wizard.campaign.sender = 'WELLPACK'
      expect(wizard.validateStep(2)).toBe(true)
    })

    it('stepValidation returns array of 6 booleans', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaign.name = 'Test'
      wizard.campaign.message = 'Hello'
      wizard.campaign.sender = 'WELLPACK'

      const validation = wizard.stepValidation
      expect(validation).toHaveLength(6)
      expect(validation[0]).toBe(true) // estimate
      expect(validation[1]).toBe(true) // type
      expect(validation[2]).toBe(true) // message
      expect(validation[3]).toBe(true) // LP
    })
  })

  describe('navigation — step 0 accessible from any step', () => {
    it('goToStep(0) works from step 3', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(3)
      expect(wizard.currentStep).toBe(3)

      wizard.goToStep(0)
      expect(wizard.currentStep).toBe(0)
    })

    it('goToStep(0) works from step 5', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(5)
      wizard.goToStep(0)
      expect(wizard.currentStep).toBe(0)
    })
  })

  describe('showValidation', () => {
    it('is false by default', () => {
      const wizard = useCampaignWizardStore()
      expect(wizard.showValidation).toBe(false)
    })

    it('is set to true when validateCurrentStep fails', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(2)
      wizard.campaign.name = ''
      wizard.campaign.message = ''

      wizard.validateCurrentStep()

      expect(wizard.showValidation).toBe(true)
    })

    it('stays false when validateCurrentStep succeeds', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(2)
      wizard.campaign.name = 'Test'
      wizard.campaign.message = 'Hello'
      wizard.campaign.sender = 'WELLPACK'

      wizard.validateCurrentStep()

      expect(wizard.showValidation).toBe(false)
    })

    it('is reset to false on goToStep', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(2)
      wizard.campaign.name = ''
      wizard.validateCurrentStep()
      expect(wizard.showValidation).toBe(true)

      wizard.goToStep(3)
      expect(wizard.showValidation).toBe(false)
    })
  })

  describe('reset', () => {
    it('clears all state to defaults', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaignId = 99
      wizard.currentStep = 3
      wizard.campaign.name = 'Test'
      wizard.isDirty = true

      wizard.reset()

      expect(wizard.currentStep).toBe(0)
      expect(wizard.campaignId).toBeNull()
      expect(wizard.campaign.name).toBe('')
      expect(wizard.isDirty).toBe(false)
      expect(wizard.estimate).toBeNull()
      expect(wizard.estimateStale).toBe(false)
      expect(wizard.scheduleMode).toBe('now')
      expect(wizard.reviewChecks.messageVerified).toBe(false)
      expect(wizard.reviewChecks.sendConfirmed).toBe(false)
      expect(wizard.showValidation).toBe(false)
    })
  })

  // QW7 — estimateStale
  describe('estimateStale', () => {
    it('is false by default', () => {
      const wizard = useCampaignWizardStore()
      expect(wizard.estimateStale).toBe(false)
    })

    it('becomes true when targeting changes with existing estimate', async () => {
      const wizard = useCampaignWizardStore()
      wizard.estimate = { volume: 1000, unitPrice: 0.04, totalPrice: 40, smsCount: 1 }
      wizard.campaign.targeting.departments = ['75']
      await vi.dynamicImportSettled()

      expect(wizard.estimateStale).toBe(true)
    })

    it('stays false when targeting changes WITHOUT existing estimate', async () => {
      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.departments = ['75']
      await vi.dynamicImportSettled()

      expect(wizard.estimateStale).toBe(false)
    })

    it('resets to false after requestEstimate succeeds', async () => {
      mockPost.mockResolvedValue({
        data: { data: { volume: '1000', unit_price: '0.045', total_price: '45.00', sms_count: '1' } },
        error: null,
      })

      const wizard = useCampaignWizardStore()
      wizard.estimate = { volume: 500, unitPrice: 0.04, totalPrice: 20, smsCount: 1 }
      wizard.estimateStale = true

      await wizard.requestEstimate()

      expect(wizard.estimateStale).toBe(false)
    })

    it('resets to false in reset()', () => {
      const wizard = useCampaignWizardStore()
      wizard.estimateStale = true

      wizard.reset()

      expect(wizard.estimateStale).toBe(false)
    })
  })

  // QW2 — Debounced auto-estimate
  describe('debouncedEstimate', () => {
    it('triggers requestEstimate after 1500ms when valid targeting changes', async () => {
      vi.useFakeTimers()
      mockPost.mockResolvedValue({
        data: { data: { volume: '1000', unit_price: '0.045', total_price: '45.00', sms_count: '1' } },
        error: null,
      })

      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.method = 'department'
      wizard.campaign.targeting.departments = ['75']
      await vi.dynamicImportSettled()

      vi.advanceTimersByTime(1500)
      await vi.dynamicImportSettled()
      await vi.runAllTimersAsync()

      expect(mockPost).toHaveBeenCalledWith('/estimate', expect.anything())
      vi.useRealTimers()
    })

    it('does NOT trigger if targeting is invalid', async () => {
      vi.useFakeTimers()

      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.method = 'department'
      wizard.campaign.targeting.departments = []
      await vi.dynamicImportSettled()

      vi.advanceTimersByTime(2000)
      await vi.dynamicImportSettled()

      expect(mockPost).not.toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('rapid changes trigger only one call (debounce)', async () => {
      vi.useFakeTimers()
      mockPost.mockResolvedValue({
        data: { data: { volume: '1000', unit_price: '0.045', total_price: '45.00', sms_count: '1' } },
        error: null,
      })

      const wizard = useCampaignWizardStore()
      wizard.campaign.targeting.method = 'department'
      wizard.campaign.targeting.departments = ['75']
      await vi.dynamicImportSettled()

      wizard.campaign.targeting.departments = ['75', '13']
      await vi.dynamicImportSettled()

      wizard.campaign.targeting.departments = ['75', '13', '69']
      await vi.dynamicImportSettled()

      vi.advanceTimersByTime(1500)
      await vi.dynamicImportSettled()
      await vi.runAllTimersAsync()

      // Should only be called once (debounced)
      const estimateCalls = mockPost.mock.calls.filter((args: unknown[]) => args[0] === '/estimate')
      expect(estimateCalls.length).toBe(1)
      vi.useRealTimers()
    })
  })

  // QW0 — initFromCampaign + isPreFilled
  describe('initFromCampaign', () => {
    it('pre-fills type, channel, targeting, landing_page_id', () => {
      const wizard = useCampaignWizardStore()
      wizard.initFromCampaign({
        type: 'fidelisation',
        channel: 'sms',
        targeting: {
          method: 'department',
          departments: ['75', '13'],
          postcodes: [],
          address: null,
          lat: null,
          lng: null,
          radius: null,
          gender: 'F',
          age_min: 25,
          age_max: 55,
        },
        landing_page_id: 7,
      })

      expect(wizard.campaign.type).toBe('fidelisation')
      expect(wizard.campaign.channel).toBe('sms')
      expect(wizard.campaign.targeting.departments).toEqual(['75', '13'])
      expect(wizard.campaign.targeting.gender).toBe('F')
      expect(wizard.campaign.landing_page_id).toBe(7)
    })

    it('leaves name, message, sender empty', () => {
      const wizard = useCampaignWizardStore()
      wizard.initFromCampaign({ type: 'prospection' })

      expect(wizard.campaign.name).toBe('')
      expect(wizard.campaign.message).toBe('')
      expect(wizard.campaign.sender).toBe('')
    })

    it('campaignId is null (new draft)', () => {
      const wizard = useCampaignWizardStore()
      wizard.campaignId = 99
      wizard.initFromCampaign({ type: 'prospection' })

      expect(wizard.campaignId).toBeNull()
    })

    it('is_demo is false even if source was demo', () => {
      const wizard = useCampaignWizardStore()
      wizard.initFromCampaign({ type: 'prospection' })

      expect(wizard.campaign.is_demo).toBe(false)
    })

    it('sets isPreFilled to true', () => {
      const wizard = useCampaignWizardStore()
      wizard.initFromCampaign({ type: 'prospection' })

      expect(wizard.isPreFilled).toBe(true)
    })

    it('targeting fallback to freshDraft if null', () => {
      const wizard = useCampaignWizardStore()
      wizard.initFromCampaign({ type: 'prospection', targeting: null })

      expect(wizard.campaign.targeting.method).toBe('postcode')
      expect(wizard.campaign.targeting.departments).toEqual([])
    })

    it('estimateStale is false after init', () => {
      const wizard = useCampaignWizardStore()
      wizard.initFromCampaign({ type: 'prospection' })

      expect(wizard.estimateStale).toBe(false)
    })
  })
})
