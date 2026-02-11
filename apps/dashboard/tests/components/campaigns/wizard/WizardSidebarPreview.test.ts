import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../../helpers/auth-stubs'
import { mockUseI18n } from '../../../helpers/stubs'

stubAuthGlobals({ $api: { POST: vi.fn(), PUT: vi.fn(), GET: vi.fn() } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

const { useCampaignWizardStore } = await import('@/stores/campaignWizard')
const WizardSidebarPreview = (await import('@/components/campaigns/wizard/WizardSidebarPreview.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: { template: '<div data-card><slot /></div>' },
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardContent: slotStub,
  SmsPreview: { template: '<div data-sms-preview />', props: ['sender', 'message', 'placeholder'] },
}

function mountPanel() {
  return mount(WizardSidebarPreview, {
    global: { stubs: baseStubs },
  })
}

describe('WizardSidebarPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('renders SmsPreview with store values', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.sender = 'WELLPACK'
    wizard.campaign.message = 'Hello!'

    const wrapper = mountPanel()
    const preview = wrapper.findComponent(baseStubs.SmsPreview)
    expect(preview.exists()).toBe(true)
    expect(preview.props('sender')).toBe('WELLPACK')
    expect(preview.props('message')).toBe('Hello!')
  })

  it('renders SmsPreview with default sender when empty', () => {
    const wrapper = mountPanel()
    const preview = wrapper.findComponent(baseStubs.SmsPreview)
    expect(preview.props('sender')).toBe('SMS')
  })

  it('renders progress checklist with 5 items', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-sidebar-checklist]').exists()).toBe(true)
    for (let i = 0; i < 5; i++) {
      expect(wrapper.find(`[data-checklist-item="${i}"]`).exists()).toBe(true)
    }
  })

  it('checklist shows valid steps with Check icon', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.type = 'prospection'
    wizard.currentStep = 1

    const wrapper = mountPanel()
    const item0 = wrapper.find('[data-checklist-item="0"]')
    expect(item0.text()).toContain('wizard.steps.type')
  })

  it('renders sidebar preview card', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-sidebar-preview]').exists()).toBe(true)
  })
})
