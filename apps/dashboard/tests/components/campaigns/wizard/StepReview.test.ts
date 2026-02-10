import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../../helpers/auth-stubs'
import { mockUseI18n } from '../../../helpers/stubs'

const mockPost = vi.fn()
stubAuthGlobals({ $api: { POST: mockPost, PUT: vi.fn(), GET: vi.fn() } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()
vi.stubGlobal('navigateTo', vi.fn())

const { useCampaignWizardStore } = await import('@/stores/campaignWizard')
const StepReview = (await import('@/components/campaigns/wizard/StepReview.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: { template: '<div data-card><slot /></div>' },
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardContent: slotStub,
  Button: { template: '<button data-button><slot /></button>' },
  Badge: { template: '<span data-badge><slot /></span>' },
  Checkbox: { template: '<input type="checkbox" data-checkbox />', props: ['modelValue'], emits: ['update:modelValue'] },
  Separator: { template: '<hr />' },
  AlertDialog: slotStub,
  AlertDialogTrigger: slotStub,
  AlertDialogContent: slotStub,
  AlertDialogHeader: slotStub,
  AlertDialogTitle: slotStub,
  AlertDialogDescription: slotStub,
  AlertDialogFooter: slotStub,
  AlertDialogCancel: slotStub,
  AlertDialogAction: slotStub,
}

describe('StepReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('render 5 sections récap', () => {
    const wrapper = mount(StepReview, {
      global: { stubs: baseStubs },
    })

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

  it('targeting section shows department count for department method', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.targeting.method = 'department'
    wizard.campaign.targeting.departments = ['75', '13']

    const wrapper = mount(StepReview, { global: { stubs: baseStubs } })
    expect(wrapper.text()).toContain('2')
  })

  it('targeting section shows address with radius for address method', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.targeting.method = 'address'
    wizard.campaign.targeting.address = 'Paris'
    wizard.campaign.targeting.radius = 10

    const wrapper = mount(StepReview, { global: { stubs: baseStubs } })
    expect(wrapper.text()).toContain('wizard.review.addressRadius')
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
})
