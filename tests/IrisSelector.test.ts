import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from './helpers/stubs'

mockUseI18n()

// Mock useCommuneSearch
const mockCommuneResults = ref<Array<{ nom: string, code: string, codesPostaux: string[], population: number | null }>>([])
const mockCommuneQuery = ref('')
const mockIsSearching = ref(false)

vi.mock('@/composables/useCommuneSearch', () => ({
  useCommuneSearch: () => ({
    query: mockCommuneQuery,
    results: mockCommuneResults,
    isSearching: mockIsSearching,
    clear: vi.fn(),
  }),
}))

// Mock fetch for IRIS zones API
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const IrisSelector = (await import('@/components/targeting/IrisSelector.vue')).default

const InputStub = {
  template: '<input :value="modelValue" v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  inheritAttrs: true,
}

const baseStubs = {
  Input: InputStub,
  Badge: { template: '<span data-iris-chip><slot /><button data-remove-iris @click="$emit(\'click\')">×</button></span>', emits: ['click'] },
  Checkbox: { template: '<input type="checkbox" :checked="checked" @change="$emit(\'update:checked\', !checked)" />', props: ['checked'], emits: ['update:checked'] },
  TransitionGroup: { template: '<div><slot /></div>' },
}

describe('IrisSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCommuneResults.value = []
    mockCommuneQuery.value = ''
    mockIsSearching.value = false
    mockFetch.mockReset()
  })

  it('renders commune search field', () => {
    const wrapper = mount(IrisSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-iris-commune-field]').exists()).toBe(true)
  })

  it('shows commune dropdown when searching', async () => {
    mockCommuneResults.value = [
      { nom: 'Paris', code: '75056', codesPostaux: ['75001'], population: 2161000 },
    ]

    const wrapper = mount(IrisSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-iris-commune-field]')
    await input.setValue('Par')
    await input.trigger('input')

    expect(wrapper.find('[data-iris-commune-dropdown]').exists()).toBe(true)
  })

  it('fetches IRIS zones on commune selection', async () => {
    mockCommuneResults.value = [
      { nom: 'Paris 1er', code: '75101', codesPostaux: ['75001'], population: 16000 },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [
          { code: '751010101', name: 'Louvre', commune_name: 'Paris 1er' },
          { code: '751010102', name: 'Palais-Royal', commune_name: 'Paris 1er' },
        ],
      }),
    })

    const wrapper = mount(IrisSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-iris-commune-field]')
    await input.setValue('Paris')
    await input.trigger('input')

    await wrapper.find('[data-iris-commune-option]').trigger('mousedown')

    // Wait for fetch to resolve
    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  it('removes IRIS code badge', async () => {
    const wrapper = mount(IrisSelector, {
      props: { modelValue: ['751010101', '751010102'] },
      global: { stubs: baseStubs },
    })

    const removeBtn = wrapper.find('[data-remove-iris]')
    expect(removeBtn.exists()).toBe(true)
    await removeBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('renders badges for selected codes', () => {
    const wrapper = mount(IrisSelector, {
      props: { modelValue: ['751010101'] },
      global: { stubs: baseStubs },
    })
    expect(wrapper.findAll('[data-iris-chip]')).toHaveLength(1)
  })

  it('shows selected count text', () => {
    const wrapper = mount(IrisSelector, {
      props: { modelValue: ['751010101', '751010102'] },
      global: { stubs: baseStubs },
    })
    expect(wrapper.text()).toContain('wizard.targeting.iris.selected')
  })
})
