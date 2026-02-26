import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from './helpers/stubs'

mockUseI18n()

const mockQuery = ref('')
const mockIsSearching = ref(false)
const mockDepartmentResults = ref<any[]>([])
const mockAddressResults = ref<any[]>([])
const mockPostcodeResults = ref<any[]>([])
const mockClear = vi.fn()

vi.mock('@/composables/useSmartSearch', () => ({
  useSmartSearch: () => ({
    query: mockQuery,
    isSearching: mockIsSearching,
    groupedResults: computed(() => ({
      departments: mockDepartmentResults.value,
      postcodes: mockPostcodeResults.value,
      addresses: mockAddressResults.value,
    })),
    hasResults: computed(() =>
      mockDepartmentResults.value.length > 0
      || mockAddressResults.value.length > 0
      || mockPostcodeResults.value.length > 0,
    ),
    clear: mockClear,
  }),
}))

vi.mock('@/composables/useLogarithmicRadius', () => ({
  sliderToKm: (pos: number) => pos,
  kmToSlider: (km: number) => km,
}))

const SmartSearch = (await import('@/components/targeting/SmartSearch.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Badge: { template: '<span v-bind="$attrs"><slot /></span>', inheritAttrs: true },
  Button: { template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>', emits: ['click'], inheritAttrs: true },
  Card: { template: '<div v-bind="$attrs"><slot /></div>', inheritAttrs: true },
  CardContent: slotStub,
  Input: { template: '<input v-bind="$attrs" />', inheritAttrs: true },
  Label: { template: '<label><slot /></label>' },
  Slider: { template: '<div data-radius-input />', props: ['modelValue', 'min', 'max', 'step'] },
}

const defaultProps = {
  departments: [] as string[],
  postcodes: [] as string[],
  address: null as string | null,
  lat: null as number | null,
  lng: null as number | null,
  radius: null as number | null,
}

describe('SmartSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.value = ''
    mockIsSearching.value = false
    mockDepartmentResults.value = []
    mockAddressResults.value = []
    mockPostcodeResults.value = []
  })

  it('renders search input', () => {
    const wrapper = mount(SmartSearch, {
      props: defaultProps,
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-smart-search-input]').exists()).toBe(true)
  })

  it('shows no dropdown when no results', () => {
    const wrapper = mount(SmartSearch, {
      props: defaultProps,
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-smart-search-dropdown]').exists()).toBe(false)
  })

  it('shows dropdown with department results', async () => {
    mockDepartmentResults.value = [
      { type: 'department', label: '75 — Paris', departmentCode: '75', departmentName: 'Paris' },
    ]
    const wrapper = mount(SmartSearch, {
      props: defaultProps,
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-smart-search-dropdown]').exists()).toBe(true)
    expect(wrapper.find('[data-group-departments]').exists()).toBe(true)
    expect(wrapper.findAll('[data-search-result]')).toHaveLength(1)
  })

  it('shows address group in dropdown', async () => {
    mockAddressResults.value = [
      { type: 'address', label: '12 rue de Lyon, 69007', lat: 45.75, lng: 4.85 },
    ]
    const wrapper = mount(SmartSearch, {
      props: defaultProps,
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-group-addresses]').exists()).toBe(true)
  })

  it('shows postcode group in dropdown', async () => {
    mockPostcodeResults.value = [
      { type: 'postcode', label: 'Paris 1er', postcode: '75001', city: 'Paris' },
    ]
    const wrapper = mount(SmartSearch, {
      props: defaultProps,
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-group-postcodes]').exists()).toBe(true)
  })

  it('emits select when clicking a result', async () => {
    const dept = { type: 'department', label: '75 — Paris', departmentCode: '75', departmentName: 'Paris' }
    mockDepartmentResults.value = [dept]

    const wrapper = mount(SmartSearch, {
      props: defaultProps,
      global: { stubs: baseStubs },
    })

    await wrapper.find('[data-search-result]').trigger('mousedown')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0][0]).toEqual(dept)
    expect(mockClear).toHaveBeenCalled()
  })

  it('shows department chips when departments selected', () => {
    const wrapper = mount(SmartSearch, {
      props: { ...defaultProps, departments: ['75', '92'] },
      global: { stubs: baseStubs },
    })
    expect(wrapper.findAll('[data-dept-chip]')).toHaveLength(2)
  })

  it('shows postcode chips when postcodes selected', () => {
    const wrapper = mount(SmartSearch, {
      props: { ...defaultProps, postcodes: ['75001'] },
      global: { stubs: baseStubs },
    })
    expect(wrapper.findAll('[data-cp-chip]')).toHaveLength(1)
  })

  it('shows address chip when address selected', () => {
    const wrapper = mount(SmartSearch, {
      props: { ...defaultProps, address: 'Paris', lat: 48.86, lng: 2.34, radius: 5 },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-address-chip]').exists()).toBe(true)
  })

  it('shows radius slider when address is selected', () => {
    const wrapper = mount(SmartSearch, {
      props: { ...defaultProps, address: 'Paris', lat: 48.86, lng: 2.34, radius: 5 },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-radius-input]').exists()).toBe(true)
    expect(wrapper.find('[data-address-recap]').exists()).toBe(true)
  })

  it('does not show radius slider without address', () => {
    const wrapper = mount(SmartSearch, {
      props: defaultProps,
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-radius-input]').exists()).toBe(false)
  })

  it('does not show chips when nothing selected', () => {
    const wrapper = mount(SmartSearch, {
      props: defaultProps,
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-smart-search-chips]').exists()).toBe(false)
  })
})
