import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'

const mockPost = vi.fn()
const mockPut = vi.fn()
const mockGet = vi.fn()

stubAuthGlobals({ $api: { POST: mockPost, PUT: mockPut, GET: mockGet } })

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

  describe('validation', () => {
    it('validateStep 0 returns true (type always set)', () => {
      const wizard = useCampaignWizardStore()
      expect(wizard.validateCurrentStep()).toBe(true)
    })

    it('step 1: returns false if name empty', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(1)
      wizard.campaign.name = ''
      wizard.campaign.message = 'Hello'
      expect(wizard.validateCurrentStep()).toBe(false)
    })

    it('step 1: returns false if message empty', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(1)
      wizard.campaign.name = 'Test'
      wizard.campaign.message = ''
      expect(wizard.validateCurrentStep()).toBe(false)
    })

    it('step 1: returns false if forbidden domain in message', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(1)
      wizard.campaign.name = 'Test'
      wizard.campaign.message = 'Visit rsms.co'
      expect(wizard.validateCurrentStep()).toBe(false)
    })

    it('step 1: returns true for valid name + message', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(1)
      wizard.campaign.name = 'Promo'
      wizard.campaign.message = 'Bonjour'
      expect(wizard.validateCurrentStep()).toBe(true)
    })

    it('step 2 department: returns false if no departments', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(2)
      wizard.campaign.targeting.method = 'department'
      wizard.campaign.targeting.departments = []
      expect(wizard.validateCurrentStep()).toBe(false)
    })

    it('step 2 department: returns true with departments selected', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(2)
      wizard.campaign.targeting.method = 'department'
      wizard.campaign.targeting.departments = ['75']
      expect(wizard.validateCurrentStep()).toBe(true)
    })

    it('step 2 postcode: returns true with postcodes', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(2)
      wizard.campaign.targeting.method = 'postcode'
      wizard.campaign.targeting.postcodes = ['75001']
      expect(wizard.validateCurrentStep()).toBe(true)
    })

    it('step 2 address: returns true with full address data', () => {
      const wizard = useCampaignWizardStore()
      wizard.goToStep(2)
      wizard.campaign.targeting.method = 'address'
      wizard.campaign.targeting.address = 'Paris'
      wizard.campaign.targeting.lat = 48.86
      wizard.campaign.targeting.lng = 2.34
      wizard.campaign.targeting.radius = 10
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

    it('requestEstimate calls POST /campaigns/{id}/estimate', async () => {
      mockPost.mockResolvedValue({
        data: { data: { volume: '1000', unit_price: '0.045', total_price: '45.00', sms_count: '1' } },
        error: null,
      })

      const wizard = useCampaignWizardStore()
      wizard.campaignId = 99

      await wizard.requestEstimate()

      expect(mockPost).toHaveBeenCalledWith('/campaigns/{campaign}/estimate', expect.objectContaining({
        params: { path: { campaign: 99 } },
      }))
      expect(wizard.estimate).toEqual({
        volume: 1000,
        unitPrice: 0.045,
        totalPrice: 45,
        smsCount: 1,
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
      expect(wizard.scheduleMode).toBe('now')
      expect(wizard.reviewChecks.messageVerified).toBe(false)
      expect(wizard.reviewChecks.sendConfirmed).toBe(false)
    })
  })
})
