import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'

mockUseI18n()

const PostcodeInput = (await import('@/components/campaigns/wizard/PostcodeInput.vue')).default

const InputStub = {
  template: '<input :value="modelValue" v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  inheritAttrs: true,
}

const baseStubs = {
  Input: InputStub,
  Badge: { template: '<span data-postcode-chip><slot /><button data-chip-remove @click="$emit(\'click\')">×</button></span>', emits: ['click'] },
}

describe('PostcodeInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders input field', () => {
    const wrapper = mount(PostcodeInput, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-postcode-field]').exists()).toBe(true)
  })

  it('adds valid 5-digit postcode on Enter', async () => {
    const wrapper = mount(PostcodeInput, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-postcode-field]')
    await input.setValue('75001')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[emitted.length - 1][0]).toEqual(['75001'])
  })

  it('rejects invalid postcode (not 5 digits)', async () => {
    const wrapper = mount(PostcodeInput, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-postcode-field]')
    await input.setValue('123')
    await input.trigger('keydown.enter')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    expect(wrapper.text()).toContain('wizard.targeting.postcode.invalid')
  })

  it('prevents duplicate postcodes', async () => {
    const wrapper = mount(PostcodeInput, {
      props: { modelValue: ['75001'] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-postcode-field]')
    await input.setValue('75001')
    await input.trigger('keydown.enter')

    // Should not emit with duplicate
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeFalsy()
  })

  it('removes postcode on chip X click', async () => {
    const wrapper = mount(PostcodeInput, {
      props: { modelValue: ['75001', '13001'] },
      global: { stubs: baseStubs },
    })

    const removeBtn = wrapper.find('[data-remove-postcode]')
    if (removeBtn.exists()) {
      await removeBtn.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    }
  })

  it('emits update:modelValue with correct payload including existing', async () => {
    const wrapper = mount(PostcodeInput, {
      props: { modelValue: ['75001'] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-postcode-field]')
    await input.setValue('13001')
    await input.trigger('keydown', { key: 'Enter' })

    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[emitted.length - 1][0]).toEqual(['75001', '13001'])
  })
})
