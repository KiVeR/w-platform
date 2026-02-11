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

const SmsEditorStub = {
  name: 'SmsEditor',
  template: '<div data-sms-editor />',
  props: ['name', 'sender', 'message', 'variables', 'labels', 'showPreview'],
  emits: ['update:name', 'update:sender', 'update:message', 'dirty'],
}

describe('StepMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  function mountStep() {
    return mount(StepMessage, {
      global: { stubs: { SmsEditor: SmsEditorStub } },
    })
  }

  it('renders SmsEditor', () => {
    const wrapper = mountStep()
    expect(wrapper.find('[data-sms-editor]').exists()).toBe(true)
  })

  it('passes store values as props', () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.name = 'Test Campaign'
    wizard.campaign.sender = 'WELLPACK'
    wizard.campaign.message = 'Hello'

    const wrapper = mountStep()
    const editor = wrapper.findComponent(SmsEditorStub)

    expect(editor.props('name')).toBe('Test Campaign')
    expect(editor.props('sender')).toBe('WELLPACK')
    expect(editor.props('message')).toBe('Hello')
  })

  it('passes showPreview as true', () => {
    const wrapper = mountStep()
    const editor = wrapper.findComponent(SmsEditorStub)
    expect(editor.props('showPreview')).toBe(true)
  })

  it('passes 3 variables with correct keys', () => {
    const wrapper = mountStep()
    const editor = wrapper.findComponent(SmsEditorStub)
    const vars = editor.props('variables')

    expect(vars).toHaveLength(3)
    expect(vars[0].key).toBe('shortUrl')
    expect(vars[1].key).toBe('prenom')
    expect(vars[2].key).toBe('nom')
  })

  it('passes labels with required keys', () => {
    const wrapper = mountStep()
    const editor = wrapper.findComponent(SmsEditorStub)
    const labels = editor.props('labels')

    expect(labels).toHaveProperty('name')
    expect(labels).toHaveProperty('messageLabel')
    expect(labels).toHaveProperty('stopTitle', 'STOP SMS')
    expect(labels).toHaveProperty('previewPlaceholder')
  })

  it('update:name updates store and sets dirty', async () => {
    const wizard = useCampaignWizardStore()
    const wrapper = mountStep()

    await wrapper.findComponent(SmsEditorStub).vm.$emit('update:name', 'New Name')

    expect(wizard.campaign.name).toBe('New Name')
    expect(wizard.isDirty).toBe(true)
  })

  it('update:sender updates store and sets dirty', async () => {
    const wizard = useCampaignWizardStore()
    const wrapper = mountStep()

    await wrapper.findComponent(SmsEditorStub).vm.$emit('update:sender', 'NEWCO')

    expect(wizard.campaign.sender).toBe('NEWCO')
    expect(wizard.isDirty).toBe(true)
  })

  it('update:message updates store and sets dirty', async () => {
    const wizard = useCampaignWizardStore()
    const wrapper = mountStep()

    await wrapper.findComponent(SmsEditorStub).vm.$emit('update:message', 'New msg')

    expect(wizard.campaign.message).toBe('New msg')
    expect(wizard.isDirty).toBe(true)
  })

  it('dirty event sets isDirty', async () => {
    const wizard = useCampaignWizardStore()
    const wrapper = mountStep()

    await wrapper.findComponent(SmsEditorStub).vm.$emit('dirty')

    expect(wizard.isDirty).toBe(true)
  })

  it('renders step title', () => {
    const wrapper = mountStep()
    expect(wrapper.text()).toContain('wizard.message.title')
  })
})
