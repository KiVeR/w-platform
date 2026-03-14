import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from './helpers/stubs'

mockUseI18n()

// Mock useCommuneSearch
const mockCommuneResults = ref<Array<{ nom: string, code: string, codesPostaux: string[], population: number | null }>>([])
const mockCommuneQuery = ref('')
const mockIsSearching = ref(false)

vi.mock('#targeting/composables/useCommuneSearch', () => ({
  useCommuneSearch: () => ({
    query: mockCommuneQuery,
    results: mockCommuneResults,
    isSearching: mockIsSearching,
    clear: vi.fn(),
  }),
}))

const PostcodeSelector = (await import('#targeting/components/targeting/PostcodeSelector.vue')).default

const InputStub = {
  template: '<input :value="modelValue" v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  inheritAttrs: true,
}

const baseStubs = {
  Input: InputStub,
  Badge: { template: '<span data-postcode-chip><slot /><button data-chip-remove @click="$emit(\'click\')">×</button></span>', emits: ['click'] },
  TransitionGroup: { template: '<div><slot /></div>' },
}

describe('PostcodeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCommuneResults.value = []
    mockCommuneQuery.value = ''
    mockIsSearching.value = false
  })

  it('renders input field', () => {
    const wrapper = mount(PostcodeSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })
    expect(wrapper.find('[data-postcode-field]').exists()).toBe(true)
  })

  it('adds valid 5-digit postcode on Enter', async () => {
    const wrapper = mount(PostcodeSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-postcode-field]')
    await input.setValue('75001')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted.at(-1)?.[0]).toEqual(['75001'])
  })

  it('rejects invalid postcode (not 5 digits)', async () => {
    const wrapper = mount(PostcodeSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-postcode-field]')
    await input.setValue('123')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    expect(wrapper.text()).toContain('wizard.targeting.postcode.invalid')
  })

  it('prevents duplicate postcodes', async () => {
    const wrapper = mount(PostcodeSelector, {
      props: { modelValue: ['75001'] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-postcode-field]')
    await input.setValue('75001')
    await input.trigger('keydown', { key: 'Enter' })

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeFalsy()
  })

  it('removes postcode on chip X click', async () => {
    const wrapper = mount(PostcodeSelector, {
      props: { modelValue: ['75001', '13001'] },
      global: { stubs: baseStubs },
    })

    const removeBtn = wrapper.find('[data-remove-postcode]')
    expect(removeBtn.exists()).toBe(true)
    await removeBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('emits update:modelValue with correct payload including existing', async () => {
    const wrapper = mount(PostcodeSelector, {
      props: { modelValue: ['75001'] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-postcode-field]')
    await input.setValue('13001')
    await input.trigger('keydown', { key: 'Enter' })

    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted.at(-1)?.[0]).toEqual(['75001', '13001'])
  })

  it('shows border-destructive class when error', async () => {
    const wrapper = mount(PostcodeSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-postcode-field]')
    await input.setValue('123')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.find('[data-postcode-error]').exists()).toBe(true)
  })

  // S3.3 — Commune search tests
  it('shows dropdown from first alphabetic character', async () => {
    mockCommuneResults.value = [
      { nom: 'Paris', code: '75056', codesPostaux: ['75001', '75002'], population: 2161000 },
    ]

    const wrapper = mount(PostcodeSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-postcode-field]')
    await input.setValue('Par')
    await input.trigger('input')

    expect(wrapper.find('[data-commune-dropdown]').exists()).toBe(true)
    expect(wrapper.findAll('[data-commune-option]')).toHaveLength(1)
  })

  it('selecting commune adds its postcodes', async () => {
    mockCommuneResults.value = [
      { nom: 'Aix-en-Provence', code: '13001', codesPostaux: ['13080', '13090', '13100'], population: 145000 },
    ]

    const wrapper = mount(PostcodeSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-postcode-field]')
    await input.setValue('Aix')
    await input.trigger('input')

    const option = wrapper.find('[data-commune-option]')
    await option.trigger('mousedown')

    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted.at(-1)?.[0]).toEqual(['13080', '13090', '13100'])
  })

  it('no dropdown for numeric input', async () => {
    const wrapper = mount(PostcodeSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-postcode-field]')
    await input.setValue('750')
    await input.trigger('input')

    expect(wrapper.find('[data-commune-dropdown]').exists()).toBe(false)
  })

  it('dropdown closes after selection', async () => {
    mockCommuneResults.value = [
      { nom: 'Lyon', code: '69123', codesPostaux: ['69001'], population: 516092 },
    ]

    const wrapper = mount(PostcodeSelector, {
      props: { modelValue: [] },
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-postcode-field]')
    await input.setValue('Lyon')
    await input.trigger('input')

    expect(wrapper.find('[data-commune-dropdown]').exists()).toBe(true)

    await wrapper.find('[data-commune-option]').trigger('mousedown')

    expect(wrapper.find('[data-commune-dropdown]').exists()).toBe(false)
  })

  it('multi-postcode commune adds all codes (deduped)', async () => {
    mockCommuneResults.value = [
      { nom: 'Marseille', code: '13055', codesPostaux: ['13001', '13002', '13003'], population: 870731 },
    ]

    const wrapper = mount(PostcodeSelector, {
      props: { modelValue: ['13001'] }, // 13001 already exists
      global: { stubs: baseStubs },
    })

    const input = wrapper.find('[data-postcode-field]')
    await input.setValue('Marseille')
    await input.trigger('input')

    await wrapper.find('[data-commune-option]').trigger('mousedown')

    const emitted = wrapper.emitted('update:modelValue')!
    // Should only add 13002 and 13003, not duplicate 13001
    expect(emitted.at(-1)?.[0]).toEqual(['13001', '13002', '13003'])
  })
})
