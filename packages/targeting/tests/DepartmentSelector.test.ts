import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from './helpers/stubs'

mockUseI18n()

const DepartmentSelector = (await import('#targeting/components/targeting/DepartmentSelector.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Input: { template: '<input v-bind="$attrs" />', inheritAttrs: true },
  Badge: { template: '<span data-department-chip class="inline-flex items-center" v-bind="$attrs"><slot /><button data-chip-remove @click="$emit(\'click\')">×</button></span>', emits: ['click'], inheritAttrs: true },
  Button: { template: '<button v-bind="$attrs"><slot /></button>', inheritAttrs: true },
  Checkbox: { template: '<input type="checkbox" :checked="checked" v-bind="$attrs" />', props: ['checked'], inheritAttrs: true },
  ScrollArea: slotStub,
  ScrollBar: slotStub,
  TransitionGroup: slotStub,
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

    const items = wrapper.findAll('[data-dept-item]')
    expect(items.length).toBeGreaterThan(0)
    await items[0]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('clicking chip X removes department and emits', async () => {
    const wrapper = mount(DepartmentSelector, {
      props: { modelValue: ['75'] },
      global: { stubs: baseStubs },
    })

    const removeBtn = wrapper.find('[data-remove-dept]')
    expect(removeBtn.exists()).toBe(true)
    await removeBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted.at(-1)?.[0]).not.toContain('75')
  })

  it('search filters departments by name', () => {
    const wrapper = mount(DepartmentSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('Paris')
  })

  it('emits update:modelValue with correct payload', async () => {
    const wrapper = mount(DepartmentSelector, {
      props: { modelValue: ['75'] },
      global: { stubs: baseStubs },
    })

    const items = wrapper.findAll('[data-dept-item]')
    const unselected = items.find(i => !i.text().includes('Paris'))
    expect(unselected).toBeDefined()
    await unselected!.trigger('click')
    const emitted = wrapper.emitted('update:modelValue')!
    const payload = emitted.at(-1)?.[0] as string[]
    expect(payload).toContain('75')
    expect(payload.length).toBe(2)
  })

  it('checkbox rendered on each item', () => {
    const wrapper = mount(DepartmentSelector, {
      props: { modelValue: ['75'] },
      global: { stubs: baseStubs },
    })
    const checkboxes = wrapper.findAll('[data-dept-item] input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThan(0)
  })

  it('select all emits all department codes', async () => {
    const wrapper = mount(DepartmentSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })
    const selectAllBtn = wrapper.find('[data-select-all]')
    expect(selectAllBtn.exists()).toBe(true)
    await selectAllBtn.trigger('click')

    const emitted = wrapper.emitted('update:modelValue')!
    const codes = emitted.at(-1)?.[0] as string[]
    expect(codes.length).toBe(101)
  })

  it('deselect all emits empty array', async () => {
    const wrapper = mount(DepartmentSelector, {
      props: { modelValue: ['75', '13'] },
      global: { stubs: baseStubs },
    })
    const deselectBtn = wrapper.find('[data-deselect-all]')
    expect(deselectBtn.exists()).toBe(true)
    await deselectBtn.trigger('click')

    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted.at(-1)?.[0]).toEqual([])
  })
})
