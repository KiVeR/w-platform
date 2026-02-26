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

const CommuneSelector = (await import('@/components/targeting/CommuneSelector.vue')).default

const InputStub = {
  template: '<input :value="modelValue" v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  inheritAttrs: true,
}

const baseStubs = {
  Input: InputStub,
  Badge: { template: '<span data-commune-chip><slot /><button data-remove-commune @click="$emit(\'click\')">×</button></span>', emits: ['click'] },
  TransitionGroup: { template: '<div><slot /></div>' },
}

describe('CommuneSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCommuneResults.value = []
    mockCommuneQuery.value = ''
    mockIsSearching.value = false
  })

  it('renders input field', () => {
    const wrapper = mount(CommuneSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-commune-field]').exists()).toBe(true)
  })

  it('shows dropdown from first character', async () => {
    mockCommuneResults.value = [
      { nom: 'Clavette', code: '17109', codesPostaux: ['17220'], population: 1200 },
    ]

    const wrapper = mount(CommuneSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-commune-field]')
    await input.setValue('Clav')
    await input.trigger('input')

    expect(wrapper.find('[data-commune-dropdown]').exists()).toBe(true)
    expect(wrapper.findAll('[data-commune-option]')).toHaveLength(1)
  })

  it('selecting commune emits INSEE code', async () => {
    mockCommuneResults.value = [
      { nom: 'Clavette', code: '17109', codesPostaux: ['17220'], population: 1200 },
    ]

    const wrapper = mount(CommuneSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-commune-field]')
    await input.setValue('Clav')
    await input.trigger('input')

    await wrapper.find('[data-commune-option]').trigger('mousedown')

    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[emitted.length - 1][0]).toEqual(['17109'])
  })

  it('prevents duplicate commune selection', async () => {
    mockCommuneResults.value = [
      { nom: 'Clavette', code: '17109', codesPostaux: ['17220'], population: 1200 },
    ]

    const wrapper = mount(CommuneSelector, {
      props: { modelValue: ['17109'] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-commune-field]')
    await input.setValue('Clav')
    await input.trigger('input')

    await wrapper.find('[data-commune-option]').trigger('mousedown')

    // Should not emit since 17109 already in modelValue
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('removes commune badge on click', async () => {
    const wrapper = mount(CommuneSelector, {
      props: { modelValue: ['17109', '75056'] },
      global: { stubs: baseStubs },
    })

    const removeBtn = wrapper.find('[data-remove-commune]')
    expect(removeBtn.exists()).toBe(true)
    await removeBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('dropdown closes after selection', async () => {
    mockCommuneResults.value = [
      { nom: 'Lyon', code: '69123', codesPostaux: ['69001'], population: 516092 },
    ]

    const wrapper = mount(CommuneSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-commune-field]')
    await input.setValue('Lyon')
    await input.trigger('input')

    expect(wrapper.find('[data-commune-dropdown]').exists()).toBe(true)

    await wrapper.find('[data-commune-option]').trigger('mousedown')

    expect(wrapper.find('[data-commune-dropdown]').exists()).toBe(false)
  })

  it('shows population in dropdown', async () => {
    mockCommuneResults.value = [
      { nom: 'Paris', code: '75056', codesPostaux: ['75001'], population: 2161000 },
    ]

    const wrapper = mount(CommuneSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-commune-field]')
    await input.setValue('Par')
    await input.trigger('input')

    expect(wrapper.text()).toContain('hab.')
  })

  it('shows INSEE code in dropdown option', async () => {
    mockCommuneResults.value = [
      { nom: 'Clavette', code: '17109', codesPostaux: ['17220'], population: 1200 },
    ]

    const wrapper = mount(CommuneSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-commune-field]')
    await input.setValue('Clav')
    await input.trigger('input')

    expect(wrapper.text()).toContain('INSEE: 17109')
  })

  it('no dropdown for empty input', async () => {
    const wrapper = mount(CommuneSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-commune-field]')
    await input.setValue('')
    await input.trigger('input')

    expect(wrapper.find('[data-commune-dropdown]').exists()).toBe(false)
  })

  it('multiple communes can be selected', async () => {
    mockCommuneResults.value = [
      { nom: 'Lyon', code: '69123', codesPostaux: ['69001'], population: 516092 },
    ]

    const wrapper = mount(CommuneSelector, {
      props: { modelValue: ['17109'] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-commune-field]')
    await input.setValue('Lyon')
    await input.trigger('input')

    await wrapper.find('[data-commune-option]').trigger('mousedown')

    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[emitted.length - 1][0]).toEqual(['17109', '69123'])
  })
})
