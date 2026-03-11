import { describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { mockUseI18n } from '../../../helpers/stubs'

vi.stubGlobal('computed', computed)
mockUseI18n()

const CollapsibleSection = (await import('@/components/campaigns/detail/CollapsibleSection.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: slotStub,
  CardContent: slotStub,
  Badge: { template: '<span data-badge><slot /></span>' },
}

describe('CollapsibleSection', () => {
  it('render avec le titre', () => {
    const wrapper = mount(CollapsibleSection, {
      props: { title: 'Message', defaultOpen: true },
      slots: { default: 'Contenu' },
      global: { stubs: baseStubs },
    })

    expect(wrapper.text()).toContain('Message')
  })

  it('toggle au clic sur le header', async () => {
    const wrapper = mount(CollapsibleSection, {
      props: { title: 'Message' },
      slots: { default: 'Contenu' },
      global: { stubs: baseStubs },
    })

    expect(wrapper.find('[data-collapsible-content]').exists()).toBe(false)

    await wrapper.get('[data-collapsible-trigger]').trigger('click')

    expect(wrapper.find('[data-collapsible-content]').exists()).toBe(true)
    expect(wrapper.emitted('update:open')?.[0]).toEqual([true])
  })

  it('contenu visible quand ouvert et cache quand ferme', () => {
    const wrapper = mount(CollapsibleSection, {
      props: { title: 'Message', defaultOpen: true },
      slots: { default: 'Contenu detaille' },
      global: { stubs: baseStubs },
    })

    expect(wrapper.find('[data-collapsible-content]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Contenu detaille')
  })

  it('affiche le badge si fourni', () => {
    const wrapper = mount(CollapsibleSection, {
      props: { title: 'Message', badge: 12 },
      global: { stubs: baseStubs },
    })

    expect(wrapper.find('[data-badge]').exists()).toBe(true)
    expect(wrapper.text()).toContain('12')
  })

  it('supporte le v-model open controle par le parent', async () => {
    const Wrapper = defineComponent({
      components: { CollapsibleSection },
      setup() {
        const open = ref(false)
        return { open }
      },
      render() {
        return h(CollapsibleSection, {
          title: 'Message',
          open: this.open,
          'onUpdate:open': (value: boolean) => { this.open = value },
        }, {
          default: () => 'Contenu pilote',
        })
      },
    })

    const wrapper = mount(Wrapper, {
      global: { stubs: baseStubs },
    })

    await wrapper.get('[data-collapsible-trigger]').trigger('click')

    expect(wrapper.find('[data-collapsible-content]').exists()).toBe(true)
  })
})
