import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'

mockUseI18n()

const SmsPreview = (await import('@/components/campaigns/wizard/SmsPreview.vue')).default

describe('SmsPreview', () => {
  it('renders sender name in header', () => {
    const wrapper = mount(SmsPreview, {
      props: { sender: 'WELLPACK', message: 'Hello' },
    })
    expect(wrapper.text()).toContain('WELLPACK')
  })

  it('renders message text in bubble', () => {
    const wrapper = mount(SmsPreview, {
      props: { sender: 'TEST', message: 'Bonjour le monde' },
    })
    expect(wrapper.text()).toContain('Bonjour le monde')
  })

  it('highlights variables with data-variable attribute', () => {
    const wrapper = mount(SmsPreview, {
      props: { sender: 'TEST', message: '${prenom} test' },
    })
    expect(wrapper.find('[data-variable]').exists()).toBe(true)
    expect(wrapper.find('[data-variable]').text()).toBe('${prenom}')
  })

  it('shows placeholder when message empty', () => {
    const wrapper = mount(SmsPreview, {
      props: { sender: 'TEST', message: '' },
    })
    expect(wrapper.text()).toContain('wizard.message.previewEmpty')
  })

  it('handles multiple variables', () => {
    const wrapper = mount(SmsPreview, {
      props: { sender: 'TEST', message: '${prenom} ${nom}' },
    })
    expect(wrapper.findAll('[data-variable]')).toHaveLength(2)
  })
})
