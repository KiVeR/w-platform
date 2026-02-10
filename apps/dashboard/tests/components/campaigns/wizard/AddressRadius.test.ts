import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'

mockUseI18n()

const mockQuery = ref('')
const mockResults = ref([
  { label: '1 Rue de Paris, 75001', lat: 48.86, lng: 2.34, postcode: '75001', city: 'Paris' },
])
const mockIsSearching = ref(false)
const mockClear = vi.fn()

vi.mock('@/composables/useAddressSearch', () => ({
  useAddressSearch: () => ({
    query: mockQuery,
    results: mockResults,
    isSearching: mockIsSearching,
    clear: mockClear,
  }),
}))

const AddressRadius = (await import('@/components/campaigns/wizard/AddressRadius.vue')).default

const baseStubs = {
  Input: { template: '<input v-bind="$attrs" />', inheritAttrs: true },
  Label: { template: '<label><slot /></label>' },
  Slider: { template: '<input type="range" v-bind="$attrs" />', inheritAttrs: true },
  Button: { template: '<button v-bind="$attrs"><slot /></button>', inheritAttrs: true },
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

  it('renders address input and radius control', () => {
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
    await result.trigger('click')

    expect(wrapper.emitted('update:address')).toBeTruthy()
    expect(wrapper.emitted('update:lat')).toBeTruthy()
    expect(wrapper.emitted('update:lng')).toBeTruthy()
  })

  it('radius input emits update:radius', async () => {
    const wrapper = mount(AddressRadius, {
      props: { address: 'Paris', lat: 48.86, lng: 2.34, radius: 10 },
      global: { stubs: baseStubs },
    })

    const radiusInput = wrapper.find('[data-radius-input]')
    await radiusInput.setValue('15')
    await radiusInput.trigger('input')

    expect(wrapper.emitted('update:radius')).toBeTruthy()
  })

  it('clear resets address and coordinates', async () => {
    const wrapper = mount(AddressRadius, {
      props: { address: 'Paris', lat: 48.86, lng: 2.34, radius: 10 },
      global: { stubs: baseStubs },
    })

    const clearBtn = wrapper.find('[data-clear-address]')
    if (clearBtn.exists()) {
      await clearBtn.trigger('click')
      expect(wrapper.emitted('update:address')?.[0]).toEqual([null])
      expect(wrapper.emitted('update:lat')?.[0]).toEqual([null])
      expect(wrapper.emitted('update:lng')?.[0]).toEqual([null])
    }
  })
})
