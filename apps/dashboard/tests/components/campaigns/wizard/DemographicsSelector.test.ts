import { describe, it, expect, vi } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { localStorageMock, stubAuthGlobals } from '../../../helpers/auth-stubs'
import { mockUseI18n } from '../../../helpers/stubs'

stubAuthGlobals({ $api: { POST: vi.fn(), PUT: vi.fn(), GET: vi.fn() } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

const DemographicsSelector = (await import('@/components/campaigns/wizard/DemographicsSelector.vue')).default

const baseStubs = {
  Slider: {
    template: '<div data-age-slider @click="$emit(\'update:modelValue\', [25, 65])" />',
    props: ['modelValue', 'min', 'max', 'step'],
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
  it('renders three gender buttons', () => {
    const wrapper = mountComponent()
    const buttons = wrapper.findAll('[data-gender-button]')
    expect(buttons).toHaveLength(3)
  })

  it('highlights Mixte button by default when gender is null', () => {
    const wrapper = mountComponent()
    const buttons = wrapper.findAll('[data-gender-button]')
    expect(buttons[0].attributes('data-selected')).toBe('true')
  })

  it('selects Homme button and emits update', async () => {
    const wrapper = mountComponent()
    const buttons = wrapper.findAll('[data-gender-button]')
    await buttons[1].trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toMatchObject({ gender: 'M' })
  })

  it('selects Femme button and emits update', async () => {
    const wrapper = mountComponent()
    const buttons = wrapper.findAll('[data-gender-button]')
    await buttons[2].trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted![0][0]).toMatchObject({ gender: 'F' })
  })

  it('renders age range slider', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('[data-age-slider]').exists()).toBe(true)
  })

  it('renders age label showing "Tous âges" when default range', () => {
    const wrapper = mountComponent()
    const label = wrapper.find('[data-age-label]')
    expect(label.text()).toContain('wizard.targeting.demographics.allAges')
  })

  it('renders age label with range when age filters set', () => {
    const wrapper = mountComponent({
      modelValue: {
        method: 'department',
        departments: ['75'],
        postcodes: [],
        address: null,
        lat: null,
        lng: null,
        radius: null,
        gender: null,
        age_min: 25,
        age_max: 50,
      },
    })
    const label = wrapper.find('[data-age-label]')
    expect(label.text()).toContain('25')
    expect(label.text()).toContain('50')
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

    const buttons = wrapper.findAll('[data-gender-button]')
    expect(buttons[1].attributes('data-selected')).toBe('true')
  })

  it('renders gender group container', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('[data-gender-group]').exists()).toBe(true)
  })

  it('preset "25-45" sets ageRange to [25, 45]', async () => {
    const wrapper = mountComponent()
    const presets = wrapper.findAll('[data-age-preset]')
    // Presets: 18-25, 25-45, 45-65, 65+, Tous âges
    await presets[1].trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toMatchObject({ age_min: 25, age_max: 45 })
  })

  it('preset "Tous âges" resets age to null/null', async () => {
    const wrapper = mountComponent({
      modelValue: {
        method: 'department',
        departments: ['75'],
        postcodes: [],
        address: null,
        lat: null,
        lng: null,
        radius: null,
        gender: null,
        age_min: 25,
        age_max: 45,
      },
    })
    const presets = wrapper.findAll('[data-age-preset]')
    // Last preset is "Tous âges"
    await presets[4].trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toMatchObject({ age_min: null, age_max: null })
  })

  it('renders min/max labels (18 / 100)', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('[data-age-min-label]').text()).toBe('18')
    expect(wrapper.find('[data-age-max-label]').text()).toBe('100')
  })
})
