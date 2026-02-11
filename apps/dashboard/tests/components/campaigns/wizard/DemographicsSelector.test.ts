import { describe, it, expect, vi } from 'vitest'
import { computed, ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { localStorageMock, stubAuthGlobals } from '../../../helpers/auth-stubs'
import { mockUseI18n } from '../../../helpers/stubs'

stubAuthGlobals({ $api: { POST: vi.fn(), PUT: vi.fn(), GET: vi.fn() } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

const DemographicsSelector = (await import('@/components/campaigns/wizard/DemographicsSelector.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: { template: '<div data-card v-bind="$attrs"><slot /></div>' },
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardDescription: slotStub,
  Label: { template: '<label><slot /></label>' },
  Input: {
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" v-bind="$attrs" />',
    props: ['modelValue'],
    emits: ['update:modelValue'],
  },
}

function mountComponent(props = {}) {
  return mount(DemographicsSelector, {
    props: {
      modelValue: {
        method: 'department' as const,
        departments: ['75'],
        postcodes: [],
        address: null,
        lat: null,
        lng: null,
        radius: null,
        gender: null,
        age_min: null,
        age_max: null,
      },
      ...props,
    },
    global: { stubs: baseStubs },
  })
}

describe('DemographicsSelector', () => {
  it('renders three gender cards', () => {
    const wrapper = mountComponent()
    const cards = wrapper.findAll('[data-gender-card]')
    expect(cards).toHaveLength(3)
  })

  it('highlights Mixte card by default when gender is null', () => {
    const wrapper = mountComponent()
    const cards = wrapper.findAll('[data-gender-card]')
    expect(cards[0].attributes('data-selected')).toBe('true')
  })

  it('selects Homme card and emits update', async () => {
    const wrapper = mountComponent()
    const cards = wrapper.findAll('[data-gender-card]')
    await cards[1].trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toMatchObject({ gender: 'M' })
  })

  it('selects Femme card and emits update', async () => {
    const wrapper = mountComponent()
    const cards = wrapper.findAll('[data-gender-card]')
    await cards[2].trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted![0][0]).toMatchObject({ gender: 'F' })
  })

  it('renders age min and max inputs', () => {
    const wrapper = mountComponent()
    const inputs = wrapper.findAll('input[type="number"]')
    expect(inputs).toHaveLength(2)
  })

  it('updates age_min on input change', async () => {
    const wrapper = mountComponent()
    const inputs = wrapper.findAll('input[type="number"]')
    await inputs[0].setValue('25')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toMatchObject({ age_min: 25 })
  })

  it('updates age_max on input change', async () => {
    const wrapper = mountComponent()
    const inputs = wrapper.findAll('input[type="number"]')
    await inputs[1].setValue('50')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toMatchObject({ age_max: 50 })
  })

  it('renders with existing demographics values', () => {
    const wrapper = mountComponent({
      modelValue: {
        method: 'department',
        departments: ['75'],
        postcodes: [],
        address: null,
        lat: null,
        lng: null,
        radius: null,
        gender: 'M',
        age_min: 25,
        age_max: 50,
      },
    })

    const cards = wrapper.findAll('[data-gender-card]')
    expect(cards[1].attributes('data-selected')).toBe('true')
  })
})
