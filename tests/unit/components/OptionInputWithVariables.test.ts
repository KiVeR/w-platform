/* eslint-disable no-template-curly-in-string */
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

// Stub variable schema store
const mockVariableNames = ref<string[]>(['firstName', 'lastName', 'nom_magasin'])
const mockIsAvailable = ref(true)
const mockAllVariables = ref([
  { name: 'firstName', type: 'recipient' },
  { name: 'lastName', type: 'recipient' },
  { name: 'nom_magasin', type: 'global' },
])
const mockMergedPreviewData = ref<Record<string, string>>({
  firstName: 'Marie',
  lastName: 'Dupont',
  nom_magasin: 'Boutique Paris',
})

vi.stubGlobal('useVariableSchemaStore', () => ({
  variableNames: mockVariableNames.value,
  isAvailable: mockIsAvailable.value,
  allVariables: mockAllVariables.value,
  globalVariables: mockAllVariables.value.filter(v => v.type === 'global'),
  recipientVariables: mockAllVariables.value.filter(v => v.type === 'recipient'),
  mergedPreviewData: mockMergedPreviewData.value,
}))

// Stub useVariableAutocomplete
const mockAutocomplete = {
  isActive: ref(false),
  selectedIndex: ref(0),
  suggestions: ref<Array<{ name: string, type: string }>>([]),
  handleInput: vi.fn(),
  moveDown: vi.fn(),
  moveUp: vi.fn(),
  selectCurrent: vi.fn().mockReturnValue(null),
  dismiss: vi.fn(),
}

vi.stubGlobal('useVariableAutocomplete', () => mockAutocomplete)

// Stub useVariables
vi.stubGlobal('useVariables', () => ({
  hasVariables: (text: string) => /\$\{[^}]+\}/.test(text || ''),
  extractVariables: (text: string) => {
    if (!text)
      return []
    return [...text.matchAll(/\$\{([^}]+)\}/g)].map(m => m[1])
  },
  insertAtCursor: vi.fn((el: any, name: string) => {
    const variable = `\${${name}}`
    return (el.value || '') + variable
  }),
}))

// Mock child components
vi.mock('@@/layers/editor/components/variables/InsertVariableButton.vue', () => ({
  default: {
    name: 'InsertVariableButton',
    template: '<button class="mock-insert-btn" @click="$emit(\'insert\', \'${firstName}\')">insert</button>',
    emits: ['insert'],
  },
}))

vi.mock('@@/layers/editor/components/variables/VariableBadge.vue', () => ({
  default: {
    name: 'VariableBadge',
    template: '<span class="mock-badge">{{ name }}</span>',
    props: ['name', 'type', 'resolved', 'previewValue'],
  },
}))

describe('optionInputWithVariables', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockIsAvailable.value = true
    vi.clearAllMocks()
    mockAutocomplete.isActive.value = false
    mockAutocomplete.selectedIndex.value = 0
    mockAutocomplete.suggestions.value = []
  })

  async function mountComponent(props: Record<string, unknown> = {}) {
    const Comp = (await import('@@/layers/editor/components/options/shared/OptionInputWithVariables.vue')).default
    return mount(Comp, {
      props: {
        modelValue: '',
        ...props,
      },
    })
  }

  it('renders an input element', async () => {
    const wrapper = await mountComponent()
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('renders the insert variable button', async () => {
    const wrapper = await mountComponent()
    expect(wrapper.find('.mock-insert-btn').exists()).toBe(true)
  })

  it('displays modelValue in the input', async () => {
    const wrapper = await mountComponent({ modelValue: 'Hello ${firstName}' })
    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).value).toBe('Hello ${firstName}')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = await mountComponent({ modelValue: '' })
    const input = wrapper.find('input')
    await input.setValue('Hello')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['Hello'])
  })

  it('shows detected variable badges below input when text has variables', async () => {
    const wrapper = await mountComponent({ modelValue: 'Bonjour ${firstName}' })
    expect(wrapper.find('.mock-badge').exists()).toBe(true)
  })

  it('does not show badges when text has no variables', async () => {
    const wrapper = await mountComponent({ modelValue: 'Hello world' })
    expect(wrapper.find('.mock-badge').exists()).toBe(false)
  })

  it('hides insert button when variables are not available', async () => {
    mockIsAvailable.value = false
    const wrapper = await mountComponent()
    expect(wrapper.find('.mock-insert-btn').exists()).toBe(false)
  })

  it('passes placeholder and type to input', async () => {
    const wrapper = await mountComponent({ placeholder: 'Entrez du texte', type: 'url' })
    const input = wrapper.find('input')
    expect(input.attributes('placeholder')).toBe('Entrez du texte')
    expect(input.attributes('type')).toBe('url')
  })
})
