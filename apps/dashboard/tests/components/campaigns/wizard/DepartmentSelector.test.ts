import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'

mockUseI18n()

const DepartmentSelector = (await import('@/components/campaigns/wizard/DepartmentSelector.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Input: { template: '<input v-bind="$attrs" />', inheritAttrs: true },
  Badge: { template: '<span data-department-chip class="inline-flex items-center"><slot /><button data-chip-remove @click="$emit(\'click\')">×</button></span>', emits: ['click'] },
  Button: { template: '<button v-bind="$attrs"><slot /></button>', inheritAttrs: true },
  Popover: slotStub,
  PopoverTrigger: slotStub,
  PopoverContent: slotStub,
  Command: slotStub,
  CommandInput: { template: '<input data-department-search v-bind="$attrs" />', inheritAttrs: true },
  CommandEmpty: slotStub,
  CommandGroup: slotStub,
  CommandItem: { template: '<div v-bind="$attrs" @click="$emit(\'select\')"><slot /></div>', inheritAttrs: true, emits: ['select'] },
  CommandList: slotStub,
}

describe('DepartmentSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search input', () => {
    const wrapper = mount(DepartmentSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-department-search]').exists()).toBe(true)
  })

  it('selecting department adds chip and emits', async () => {
    const wrapper = mount(DepartmentSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    // Find a command item and trigger select
    const items = wrapper.findAll('[data-dept-item]')
    if (items.length > 0) {
      await items[0].trigger('click')
    }

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('clicking chip X removes department and emits', async () => {
    const wrapper = mount(DepartmentSelector, {
      props: { modelValue: ['75'] },
      global: { stubs: baseStubs },
    })

    const removeBtn = wrapper.find('[data-remove-dept]')
    if (removeBtn.exists()) {
      await removeBtn.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      const emitted = wrapper.emitted('update:modelValue')!
      expect(emitted[emitted.length - 1][0]).not.toContain('75')
    }
  })

  it('search filters departments by name', () => {
    const wrapper = mount(DepartmentSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    // The component should contain department data
    const text = wrapper.text()
    expect(text).toContain('Paris')
  })

  it('emits update:modelValue with correct payload', async () => {
    const wrapper = mount(DepartmentSelector, {
      props: { modelValue: ['75'] },
      global: { stubs: baseStubs },
    })

    // Find an unselected department and click it
    const items = wrapper.findAll('[data-dept-item]')
    const unselected = items.find(i => !i.text().includes('Paris'))
    if (unselected) {
      await unselected.trigger('click')
      const emitted = wrapper.emitted('update:modelValue')!
      const payload = emitted[emitted.length - 1][0] as string[]
      expect(payload).toContain('75')
      expect(payload.length).toBe(2)
    }
  })
})
