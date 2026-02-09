/* eslint-disable no-template-curly-in-string */
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

// Stub the variable schema store
const mockMergedPreviewData = ref<Record<string, string>>({})
const mockAllVariables = ref<Array<{ name: string, type: string }>>([])
const mockIsAvailable = ref(true)

vi.stubGlobal('useVariableSchemaStore', () => ({
  mergedPreviewData: mockMergedPreviewData.value,
  allVariables: mockAllVariables.value,
  isAvailable: mockIsAvailable.value,
}))

// Stub VariableBadge as a simple component
vi.mock('@@/layers/editor/components/variables/VariableBadge.vue', () => ({
  default: {
    name: 'VariableBadge',
    template: '<span class="mock-variable-badge" :class="{ \'mock-variable-badge--loading\': loading }">{{ name }}</span>',
    props: ['name', 'type', 'resolved', 'previewValue', 'loading'],
  },
}))

describe('variableText', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockMergedPreviewData.value = { firstName: 'Marie', nom_magasin: 'Boutique Paris' }
    mockAllVariables.value = [
      { name: 'firstName', type: 'recipient' },
      { name: 'nom_magasin', type: 'global' },
    ]
    mockIsAvailable.value = true
    vi.clearAllMocks()
  })

  async function mountVariableText(props: Record<string, unknown> = {}) {
    const VariableText = (await import('@@/layers/editor/components/variables/VariableText.vue')).default
    return mount(VariableText, {
      props: {
        text: 'Hello ${firstName}',
        ...props,
      },
    })
  }

  it('renders text segments and variable badges', async () => {
    const wrapper = await mountVariableText()
    expect(wrapper.text()).toContain('Hello')
    expect(wrapper.find('.mock-variable-badge').exists()).toBe(true)
  })

  it('renders plain text when no variables present', async () => {
    const wrapper = await mountVariableText({ text: 'Hello world' })
    expect(wrapper.text()).toBe('Hello world')
    expect(wrapper.find('.mock-variable-badge').exists()).toBe(false)
  })

  it('renders multiple variables', async () => {
    const wrapper = await mountVariableText({
      text: '${firstName} de ${nom_magasin}',
    })
    const badges = wrapper.findAll('.mock-variable-badge')
    expect(badges).toHaveLength(2)
  })

  it('renders as span by default', async () => {
    const wrapper = await mountVariableText()
    expect(wrapper.element.tagName.toLowerCase()).toBe('span')
  })

  it('renders with custom tag', async () => {
    const wrapper = await mountVariableText({ tag: 'div' })
    expect(wrapper.element.tagName.toLowerCase()).toBe('div')
  })

  it('handles empty text', async () => {
    const wrapper = await mountVariableText({ text: '' })
    expect(wrapper.text()).toBe('')
  })

  it('handles undefined text', async () => {
    const wrapper = await mountVariableText({ text: undefined })
    expect(wrapper.text()).toBe('')
  })

  it('passes loading to badges when schema is not available', async () => {
    mockIsAvailable.value = false
    const wrapper = await mountVariableText()
    const badge = wrapper.find('.mock-variable-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.classes()).toContain('mock-variable-badge--loading')
  })
})
