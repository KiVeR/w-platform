import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SmsEditor from '../../components/sms/SmsEditor.vue'
import type { SmsLabels, SmsVariable } from '../../types/sms'

const MobileFrameStub = {
  name: 'MobileFrame',
  template: '<div data-mobile-frame><slot /></div>',
  props: ['device'],
}

const SmsPreviewStub = {
  name: 'SmsPreview',
  template: '<div data-sms-preview-stub />',
  props: ['sender', 'message', 'placeholder'],
}

const defaultLabels: SmsLabels = {
  name: 'Nom',
  namePlaceholder: 'Nom de la campagne',
  sender: 'Expéditeur',
  senderPlaceholder: 'WELLPACK',
  senderHelp: '11 caractères max',
  messageLabel: 'Message',
  messagePlaceholder: 'Votre message...',
  insertVariable: 'Insérer variable',
  stopTitle: 'STOP SMS',
  stopDescription: 'STOP sera ajouté automatiquement',
  multiSmsWarning: 'Message sur 2 SMS',
  forbiddenDomain: 'Domaine interdit',
  charCount: '{count}/{max}',
  smsCount: '{count} SMS',
  encoding: '{encoding}',
  previewPlaceholder: 'Aperçu vide',
}

const defaultVariables: SmsVariable[] = [
  { key: 'prenom', token: '${prenom}', label: 'Prénom' },
  { key: 'nom', token: '${nom}', label: 'Nom' },
]

function mountEditor(overrides: Partial<{
  name: string
  sender: string
  message: string
  variables: SmsVariable[]
  labels: SmsLabels
  showPreview: boolean
}> = {}) {
  return mount(SmsEditor, {
    props: {
      name: 'Test Campaign',
      sender: 'WELLPACK',
      message: 'Hello',
      variables: defaultVariables,
      labels: defaultLabels,
      showPreview: true,
      ...overrides,
    },
    global: {
      stubs: {
        MobileFrame: MobileFrameStub,
        SmsPreview: SmsPreviewStub,
      },
    },
  })
}

describe('SmsEditor', () => {
  it('renders all form inputs', () => {
    const wrapper = mountEditor()
    expect(wrapper.find('[data-name-input]').exists()).toBe(true)
    expect(wrapper.find('[data-sender-input]').exists()).toBe(true)
    expect(wrapper.find('[data-message-textarea]').exists()).toBe(true)
  })

  it('renders name input with correct value', () => {
    const wrapper = mountEditor({ name: 'Ma Campagne' })
    const input = wrapper.find('[data-name-input]')
    expect((input.element as HTMLInputElement).value).toBe('Ma Campagne')
  })

  it('emits update:name on input', async () => {
    const wrapper = mountEditor()
    const input = wrapper.find('[data-name-input]')
    await input.setValue('New Name')

    expect(wrapper.emitted('update:name')).toBeTruthy()
    expect(wrapper.emitted('dirty')).toBeTruthy()
  })

  it('emits update:sender on input', async () => {
    const wrapper = mountEditor()
    const input = wrapper.find('[data-sender-input]')
    await input.setValue('NEWCO')

    expect(wrapper.emitted('update:sender')).toBeTruthy()
    expect(wrapper.emitted('dirty')).toBeTruthy()
  })

  it('emits update:message on textarea input', async () => {
    const wrapper = mountEditor()
    const textarea = wrapper.find('[data-message-textarea]')
    await textarea.setValue('New message')

    expect(wrapper.emitted('update:message')).toBeTruthy()
    expect(wrapper.emitted('dirty')).toBeTruthy()
  })

  it('shows char counter', () => {
    const wrapper = mountEditor({ message: 'Hello World' })
    const counter = wrapper.find('[data-char-counter]')
    expect(counter.exists()).toBe(true)
    expect(counter.text()).toContain('11')
    expect(counter.text()).toContain('149')
  })

  it('shows STOP alert always', () => {
    const wrapper = mountEditor()
    expect(wrapper.find('[data-stop-alert]').exists()).toBe(true)
    expect(wrapper.text()).toContain('STOP SMS')
  })

  it('shows multi-SMS alert for long messages', () => {
    const wrapper = mountEditor({ message: 'a'.repeat(200) })
    expect(wrapper.find('[data-multi-sms-alert]').exists()).toBe(true)
  })

  it('does not show multi-SMS alert for short messages', () => {
    const wrapper = mountEditor({ message: 'Hello' })
    expect(wrapper.find('[data-multi-sms-alert]').exists()).toBe(false)
  })

  it('shows forbidden domain alert', () => {
    const wrapper = mountEditor({ message: 'Visit rsms.co' })
    expect(wrapper.find('[data-forbidden-alert]').exists()).toBe(true)
  })

  it('does not show forbidden alert for clean messages', () => {
    const wrapper = mountEditor({ message: 'Hello' })
    expect(wrapper.find('[data-forbidden-alert]').exists()).toBe(false)
  })

  it('renders variable menu trigger', () => {
    const wrapper = mountEditor()
    expect(wrapper.find('[data-variable-trigger]').exists()).toBe(true)
  })

  it('opens variable dropdown on click', async () => {
    const wrapper = mountEditor()
    await wrapper.find('[data-variable-trigger]').trigger('click')
    expect(wrapper.findAll('[data-variable-item]')).toHaveLength(2)
  })

  it('emits update:message and dirty on variable insert', async () => {
    const wrapper = mountEditor({ message: 'Hello ' })
    await wrapper.find('[data-variable-trigger]').trigger('click')
    const [firstVariable] = wrapper.findAll('[data-variable-item]')
    expect(firstVariable).toBeDefined()
    await firstVariable!.trigger('click')

    const emitted = wrapper.emitted('update:message')
    expect(emitted).toBeTruthy()
    const lastEmission = emitted?.at(-1)
    expect(lastEmission?.[0]).toBe('Hello ${prenom}')
    expect(wrapper.emitted('dirty')).toBeTruthy()
  })

  it('hides variable menu when no variables provided', () => {
    const wrapper = mountEditor({ variables: [] })
    expect(wrapper.find('[data-variable-trigger]').exists()).toBe(false)
  })

  it('renders SmsPreview stub when showPreview is true', () => {
    const wrapper = mountEditor({ showPreview: true })
    expect(wrapper.find('[data-sms-preview-stub]').exists()).toBe(true)
  })

  it('hides preview when showPreview is false', () => {
    const wrapper = mountEditor({ showPreview: false })
    expect(wrapper.find('[data-sms-preview-stub]').exists()).toBe(false)
  })
})
