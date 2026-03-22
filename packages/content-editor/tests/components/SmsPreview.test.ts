import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SmsPreview from '../../components/sms/SmsPreview.vue'

const MobileFrameStub = {
  name: 'MobileFrame',
  template: '<div data-mobile-frame><slot /></div>',
  props: ['device'],
}

function mountPreview(props: { sender: string, message: string, placeholder?: string }) {
  return mount(SmsPreview, {
    props,
    global: {
      stubs: {
        MobileFrame: MobileFrameStub,
      },
    },
  })
}

describe('SmsPreview', () => {
  it('renders sender name in header', () => {
    const wrapper = mountPreview({ sender: 'WELLPACK', message: 'Hello' })
    expect(wrapper.text()).toContain('WELLPACK')
  })

  it('shows default SMS when sender is empty', () => {
    const wrapper = mountPreview({ sender: '', message: 'Hello' })
    expect(wrapper.text()).toContain('SMS')
  })

  it('renders message text in bubble', () => {
    const wrapper = mountPreview({ sender: 'TEST', message: 'Bonjour le monde' })
    expect(wrapper.text()).toContain('Bonjour le monde')
  })

  it('highlights variables with data-variable attribute', () => {
    const wrapper = mountPreview({ sender: 'TEST', message: '${prenom} test' })
    expect(wrapper.find('[data-variable]').exists()).toBe(true)
    expect(wrapper.find('[data-variable]').text()).toBe('${prenom}')
  })

  it('shows placeholder when message is empty', () => {
    const wrapper = mountPreview({ sender: 'TEST', message: '', placeholder: 'Aperçu vide' })
    expect(wrapper.text()).toContain('Aperçu vide')
  })

  it('handles multiple variables', () => {
    const wrapper = mountPreview({ sender: 'TEST', message: '${prenom} ${nom}' })
    expect(wrapper.findAll('[data-variable]')).toHaveLength(2)
  })

  it('renders inside MobileFrame stub', () => {
    const wrapper = mountPreview({ sender: 'TEST', message: 'Hello' })
    expect(wrapper.find('[data-mobile-frame]').exists()).toBe(true)
  })
})
