import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref, onMounted } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../../helpers/auth-stubs'
import { mockUseI18n } from '../../../helpers/stubs'

const mockPost = vi.fn()
const mockGet = vi.fn()
stubAuthGlobals({ $api: { POST: mockPost, PUT: vi.fn(), GET: mockGet } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('onMounted', onMounted)
mockUseI18n()
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('isForbiddenMessage', (msg: string) => msg.toLowerCase().includes('rsms.co'))
const mockGetSmsStats = (msg: string) => ({
  charCount: msg.length,
  smsCount: msg.length > 149 ? 2 : 1,
  encoding: 'gsm7' as const,
  remaining: 149 - msg.length,
  maxChars: 149,
})
vi.stubGlobal('getSmsStats', mockGetSmsStats)

vi.mock('@/stores/partner', () => ({
  usePartnerStore: () => ({
    effectivePartnerId: 42,
  }),
}))

const { useCampaignWizardStore } = await import('@/stores/campaignWizard')
const StepReview = (await import('@/components/campaigns/wizard/StepReview.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: { template: '<div data-card><slot /></div>' },
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardContent: slotStub,
  Button: { template: '<button data-button @click="$emit(\'click\')"><slot /></button>', emits: ['click'] },
  Badge: { template: '<span data-badge><slot /></span>' },
  Checkbox: { template: '<input type="checkbox" data-checkbox />', props: ['modelValue'], emits: ['update:modelValue'] },
  Separator: { template: '<hr />' },
  Input: {
    template: '<input data-input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
  },
  AlertDialog: slotStub,
  AlertDialogTrigger: slotStub,
  AlertDialogContent: slotStub,
  AlertDialogHeader: slotStub,
  AlertDialogTitle: slotStub,
  AlertDialogDescription: slotStub,
  AlertDialogFooter: slotStub,
  AlertDialogCancel: slotStub,
  AlertDialogAction: slotStub,
  SmsPreview: { template: '<div data-sms-preview />', props: ['sender', 'message'] },
}

function mountOptions() {
  return {
    global: {
      stubs: baseStubs,
      config: {
        globalProperties: {
          getSmsStats: mockGetSmsStats,
        },
      },
    },
  }
}

describe('StepReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    mockGet.mockResolvedValue({
      data: { data: { euro_credits: '100.00' } },
      error: null,
    })
  })

  it('render 5 sections récap', () => {
    const wrapper = mount(StepReview, mountOptions())

    const text = wrapper.text()
    expect(text).toContain('wizard.review.sections.type')
    expect(text).toContain('wizard.review.sections.message')
    expect(text).toContain('wizard.review.sections.targeting')
    expect(text).toContain('wizard.review.sections.landingPage')
    expect(text).toContain('wizard.review.sections.schedule')
  })

  it('checkboxes activent le bouton lancer', async () => {
    const wizard = useCampaignWizardStore()
    wizard.campaignId = 99

    const wrapper = mount(StepReview, {
      global: { stubs: baseStubs },
    })

    const launchBtn = wrapper.find('[data-launch-button]')
    expect(launchBtn.attributes('disabled')).toBeDefined()

    wizard.reviewChecks.messageVerified = true
    wizard.reviewChecks.sendConfirmed = true
    await wrapper.vm.$nextTick()

    const launchBtnAfter = wrapper.find('[data-launch-button]')
    expect(launchBtnAfter.attributes('disabled')).toBeUndefined()
  })

  it('targeting badges render for department method', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.targeting.method = 'department'
    wizard.campaign.targeting.departments = ['75', '13', '69']

    const wrapper = mount(StepReview, mountOptions())
    const badges = wrapper.findAll('[data-targeting-badge]')
    expect(badges.length).toBe(3)
  })

  it('targeting badges show overflow for >5 departments', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.targeting.method = 'department'
    wizard.campaign.targeting.departments = ['75', '13', '69', '31', '33', '59', '67']

    const wrapper = mount(StepReview, mountOptions())
    const badges = wrapper.findAll('[data-targeting-badge]')
    expect(badges.length).toBe(5)
    expect(wrapper.find('[data-targeting-overflow]').exists()).toBe(true)
  })

  it('targeting section shows address with radius for address method', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.targeting.method = 'address'
    wizard.campaign.targeting.address = 'Paris'
    wizard.campaign.targeting.radius = 10

    const wrapper = mount(StepReview, mountOptions())
    expect(wrapper.text()).toContain('Paris')
    expect(wrapper.text()).toContain('wizard.review.radius')
  })

  it('dialog confirmation avant envoi', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaignId = 99

    const wrapper = mount(StepReview, {
      global: { stubs: baseStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('wizard.review.confirmDialog.title')
    expect(text).toContain('wizard.review.confirmDialog.description')
  })

  it('SmsPreview mini renders in message section', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.message = 'Hello world'

    const wrapper = mount(StepReview, mountOptions())
    expect(wrapper.find('[data-sms-preview]').exists()).toBe(true)
  })

  it('SMS count badge shows in message section', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.message = 'Hello'

    const wrapper = mount(StepReview, mountOptions())
    expect(wrapper.find('[data-sms-count]').exists()).toBe(true)
  })

  it('estimation card shows volume and price when estimate exists', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 1000, unitPrice: 0.045, totalPrice: 45, smsCount: 1 }

    const wrapper = mount(StepReview, mountOptions())
    expect(wrapper.find('[data-estimation-card]').exists()).toBe(true)
    expect(wrapper.find('[data-estimated-volume]').exists()).toBe(true)
    expect(wrapper.find('[data-estimated-cost]').exists()).toBe(true)
  })

  it('insufficient credits badge appears when estimate exceeds credits', async () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 10000, unitPrice: 0.045, totalPrice: 450, smsCount: 1 }

    const wrapper = mount(StepReview, mountOptions())
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-insufficient-credits]').exists()).toBe(true)
  })

  it('validation icons per section', () => {
    const wrapper = mount(StepReview, mountOptions())
    const icons = wrapper.findAll('[data-validation-icon]')
    expect(icons.length).toBe(5)
  })

  it('phone input updates additional_phone', async () => {
    const wizard = useCampaignWizardStore()
    const wrapper = mount(StepReview, mountOptions())

    const input = wrapper.find('[data-phone-input]')
    expect(input.exists()).toBe(true)
    await input.setValue('0612345678')
    expect(wizard.campaign.additional_phone).toBe('0612345678')
  })

  it('enriched confirm dialog shows campaign name', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaignId = 99
    wizard.campaign.name = 'Summer Promo'

    const wrapper = mount(StepReview, mountOptions())
    expect(wrapper.text()).toContain('Summer Promo')
  })

  it('displays gender and age range in review when set', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.targeting.gender = 'M'
    wizard.campaign.targeting.age_min = 25
    wizard.campaign.targeting.age_max = 50

    const wrapper = mount(StepReview, mountOptions())
    expect(wrapper.find('[data-demographics-info]').exists()).toBe(true)
    expect(wrapper.text()).toContain('wizard.targeting.demographics.genderMale')
    expect(wrapper.text()).toContain('25')
    expect(wrapper.text()).toContain('50')
  })

  it('displays Mixte when gender is null but age is set', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.targeting.gender = null
    wizard.campaign.targeting.age_min = 18
    wizard.campaign.targeting.age_max = 65

    const wrapper = mount(StepReview, mountOptions())
    expect(wrapper.find('[data-demographics-info]').exists()).toBe(true)
    expect(wrapper.text()).toContain('wizard.targeting.demographics.genderMixed')
  })
})
