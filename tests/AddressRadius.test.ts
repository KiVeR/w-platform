import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from './helpers/stubs'

mockUseI18n()

const mockQuery = ref('')
const mockResults = ref([
  { label: '1 Rue de Paris, 75001', lat: 48.86, lng: 2.34, postcode: '75001', city: 'Paris' },
])
const mockIsSearching = ref(false)
const mockClear = vi.fn()

vi.mock('#targeting/composables/useAddressSearch', () => ({
  useAddressSearch: () => ({
    query: mockQuery,
    results: mockResults,
    isSearching: mockIsSearching,
    clear: mockClear,
  }),
}))

const AddressRadius = (await import('#targeting/components/targeting/AddressRadius.vue')).default

// Slider emits internal position [40] → sliderToKm(40) = 5 km
const SliderStub = {
  template: '<div data-radius-input v-bind="$attrs" @click="$emit(\'update:modelValue\', [40])" />',
  props: ['modelValue', 'min', 'max', 'step'],
  emits: ['update:modelValue'],
  inheritAttrs: true,
}

const baseStubs = {
  Input: { template: '<input v-bind="$attrs" />', inheritAttrs: true },
  Label: { template: '<label><slot /></label>' },
  Slider: SliderStub,
  Button: { template: '<button v-bind="$attrs"><slot /></button>', inheritAttrs: true },
  Card: { template: '<div data-address-recap v-bind="$attrs"><slot /></div>', inheritAttrs: true },
  CardContent: { template: '<div><slot /></div>' },
}

describe('AddressRadius', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.value = ''
    mockResults.value = [
      { label: '1 Rue de Paris, 75001', lat: 48.86, lng: 2.34, postcode: '75001', city: 'Paris' },
    ]
    mockIsSearching.value = false
  })

  it('renders address input and radius slider', () => {
    const wrapper = mount(AddressRadius, {
      props: { address: null, lat: null, lng: null, radius: 10 },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-address-input]').exists()).toBe(true)
    expect(wrapper.find('[data-radius-input]').exists()).toBe(true)
  })

  it('shows autocomplete results after typing', async () => {
    mockQuery.value = 'Paris'
    const wrapper = mount(AddressRadius, {
      props: { address: null, lat: null, lng: null, radius: 10 },
      global: { stubs: baseStubs },
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[data-address-result]').length).toBeGreaterThan(0)
  })

  it('selecting result emits address, lat, lng', async () => {
    mockQuery.value = 'Paris'
    const wrapper = mount(AddressRadius, {
      props: { address: null, lat: null, lng: null, radius: 10 },
      global: { stubs: baseStubs },
    })
    await wrapper.vm.$nextTick()

    const result = wrapper.find('[data-address-result]')
    await result.trigger('mousedown')

    expect(wrapper.emitted('update:address')).toBeTruthy()
    expect(wrapper.emitted('update:lat')).toBeTruthy()
    expect(wrapper.emitted('update:lng')).toBeTruthy()
  })

  it('slider emits update:radius', async () => {
    const wrapper = mount(AddressRadius, {
      props: { address: 'Paris', lat: 48.86, lng: 2.34, radius: 10 },
      global: { stubs: baseStubs },
    })

    const slider = wrapper.find('[data-radius-input]')
    await slider.trigger('click')

    expect(wrapper.emitted('update:radius')).toBeTruthy()
    // Slider emits position 40 → sliderToKm(40) = 5 km
    expect(wrapper.emitted('update:radius')![0]).toEqual([5])
  })

  it('clear resets address and coordinates', async () => {
    const wrapper = mount(AddressRadius, {
      props: { address: 'Paris', lat: 48.86, lng: 2.34, radius: 10 },
      global: { stubs: baseStubs },
    })

    const clearBtn = wrapper.find('[data-clear-address]')
    expect(clearBtn.exists()).toBe(true)
    await clearBtn.trigger('click')
    expect(wrapper.emitted('update:address')?.[0]).toEqual([null])
    expect(wrapper.emitted('update:lat')?.[0]).toEqual([null])
    expect(wrapper.emitted('update:lng')?.[0]).toEqual([null])
  })

  it('shows address recap card when address selected', () => {
    const wrapper = mount(AddressRadius, {
      props: { address: 'Paris', lat: 48.86, lng: 2.34, radius: 15 },
      global: { stubs: baseStubs },
    })

    const recap = wrapper.find('[data-address-recap]')
    expect(recap.exists()).toBe(true)
    expect(recap.text()).toContain('Paris')
  })

  it('does not show recap card when no address', () => {
    const wrapper = mount(AddressRadius, {
      props: { address: null, lat: null, lng: null, radius: 10 },
      global: { stubs: baseStubs },
    })

    expect(wrapper.find('[data-address-recap]').exists()).toBe(false)
  })
})
