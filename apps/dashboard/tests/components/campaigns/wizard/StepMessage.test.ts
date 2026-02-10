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
const StepMessage = (await import('@/components/campaigns/wizard/StepMessage.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Input: { template: '<input v-bind="$attrs" />', inheritAttrs: true },
  Textarea: { template: '<textarea v-bind="$attrs" />', inheritAttrs: true },
  Label: slotStub,
  Alert: { template: '<div v-bind="$attrs"><slot /></div>', inheritAttrs: true },
  AlertTitle: slotStub,
  AlertDescription: slotStub,
  DropdownMenu: slotStub,
  DropdownMenuTrigger: slotStub,
  DropdownMenuContent: slotStub,
  DropdownMenuItem: { template: '<div v-bind="$attrs" @click="$emit(\'click\')"><slot /></div>', inheritAttrs: true, emits: ['click'] },
  Button: { template: '<button v-bind="$attrs"><slot /></button>', inheritAttrs: true },
  SmsPreview: { template: '<div data-sms-preview />' },
}

describe('StepMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('renders campaign name input', () => {
    const wrapper = mount(StepMessage, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-name-input]').exists()).toBe(true)
  })

  it('renders sender input', () => {
    const wrapper = mount(StepMessage, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-sender-input]').exists()).toBe(true)
  })

  it('renders message textarea', () => {
    const wrapper = mount(StepMessage, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-message-textarea]').exists()).toBe(true)
  })

  it('renders variable dropdown trigger', () => {
    const wrapper = mount(StepMessage, { global: { stubs: baseStubs } })
    expect(wrapper.text()).toContain('wizard.message.insertVariable')
  })

  it('renders STOP info alert', () => {
    const wrapper = mount(StepMessage, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-stop-alert]').exists()).toBe(true)
    expect(wrapper.text()).toContain('wizard.message.stopInfo')
  })

  it('shows multi-SMS warning when message exceeds 149 chars', async () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.message = 'a'.repeat(150)

    const wrapper = mount(StepMessage, { global: { stubs: baseStubs } })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-multi-sms-alert]').exists()).toBe(true)
  })

  it('hides multi-SMS warning for short message', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.message = 'Hello'

    const wrapper = mount(StepMessage, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-multi-sms-alert]').exists()).toBe(false)
  })

  it('shows forbidden domain alert when rsms.co present', async () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.message = 'Visit rsms.co'

    const wrapper = mount(StepMessage, { global: { stubs: baseStubs } })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-forbidden-alert]').exists()).toBe(true)
  })

  it('inserting variable appends to message and sets isDirty', async () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.message = 'Bonjour '

    const wrapper = mount(StepMessage, { global: { stubs: baseStubs } })

    // Find and click variable dropdown item
    const items = wrapper.findAll('[data-variable-item]')
    if (items.length > 0) {
      await items[0].trigger('click')
    }

    expect(wizard.campaign.message).toContain('${')
    expect(wizard.isDirty).toBe(true)
  })

  it('char counter displays correct stats', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.message = 'test'

    const wrapper = mount(StepMessage, { global: { stubs: baseStubs } })
    const counter = wrapper.find('[data-char-counter]')

    expect(counter.exists()).toBe(true)
    expect(counter.text()).toContain('wizard.message.charCount')
  })

  it('renders SmsPreview component', () => {
    const wrapper = mount(StepMessage, { global: { stubs: baseStubs } })
    expect(wrapper.find('[data-sms-preview]').exists()).toBe(true)
  })

  it('name input is bound to wizard.campaign.name', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.name = 'My Campaign'

    const wrapper = mount(StepMessage, { global: { stubs: baseStubs } })
    const input = wrapper.find('[data-name-input]')

    expect(input.attributes('modelvalue')).toBe('My Campaign')
  })
})
