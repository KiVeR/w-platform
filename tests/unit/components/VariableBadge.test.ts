import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

// Stub the variable schema store
const mockMergedPreviewData = ref<Record<string, string>>({})

vi.stubGlobal('useVariableSchemaStore', () => ({
  mergedPreviewData: mockMergedPreviewData.value,
}))

describe('variableBadge', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockMergedPreviewData.value = { firstName: 'Marie', nom_magasin: 'Boutique Paris' }
    vi.clearAllMocks()
  })

  async function mountBadge(props: Record<string, unknown> = {}) {
    const VariableBadge = (await import('@@/layers/editor/components/variables/VariableBadge.vue')).default
    return mount(VariableBadge, {
      props: {
        name: 'firstName',
        ...props,
      },
    })
  }

  it('renders the variable name', async () => {
    const wrapper = await mountBadge()
    expect(wrapper.text()).toContain('firstName')
  })

  it('has the variable-badge class', async () => {
    const wrapper = await mountBadge()
    expect(wrapper.find('.variable-badge').exists()).toBe(true)
  })

  it('applies recipient type class by default', async () => {
    const wrapper = await mountBadge({ type: 'recipient' })
    expect(wrapper.find('.variable-badge--recipient').exists()).toBe(true)
  })

  it('applies global type class', async () => {
    const wrapper = await mountBadge({ type: 'global' })
    expect(wrapper.find('.variable-badge--global').exists()).toBe(true)
  })

  it('applies unresolved class when resolved is false', async () => {
    const wrapper = await mountBadge({ resolved: false })
    expect(wrapper.find('.variable-badge--unresolved').exists()).toBe(true)
  })

  it('shows preview value in tooltip when provided', async () => {
    const wrapper = await mountBadge({ previewValue: 'Marie' })
    expect(wrapper.attributes('title')).toContain('Marie')
  })

  it('renders inline (span element)', async () => {
    const wrapper = await mountBadge()
    expect(wrapper.element.tagName.toLowerCase()).toBe('span')
  })
})
