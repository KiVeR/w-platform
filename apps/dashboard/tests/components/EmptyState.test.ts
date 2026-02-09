import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '@/components/shared/EmptyState.vue'

const NuxtLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

function mountEmptyState(props: Record<string, unknown> = {}) {
  return mount(EmptyState, {
    props: {
      icon: 'Send',
      title: 'Aucune campagne',
      description: 'Créez votre première campagne SMS.',
      ...props,
    },
    global: {
      stubs: { NuxtLink: NuxtLinkStub },
    },
  })
}

describe('EmptyState', () => {
  it('affiche le titre et la description', () => {
    const wrapper = mountEmptyState()

    expect(wrapper.text()).toContain('Aucune campagne')
    expect(wrapper.text()).toContain('Créez votre première campagne SMS.')
  })

  it('affiche l\'icône', () => {
    const wrapper = mountEmptyState()

    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('affiche le bouton CTA quand actionLabel est fourni', () => {
    const wrapper = mountEmptyState({
      actionLabel: 'Nouvelle campagne',
    })

    expect(wrapper.text()).toContain('Nouvelle campagne')
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('n\'affiche pas le bouton si actionLabel est absent', () => {
    const wrapper = mountEmptyState()

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('émet "action" au clic si pas de actionTo', async () => {
    const wrapper = mountEmptyState({
      actionLabel: 'Nouvelle campagne',
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('action')).toHaveLength(1)
  })

  it('rend un NuxtLink quand actionTo est fourni', () => {
    const wrapper = mountEmptyState({
      actionLabel: 'Nouvelle campagne',
      actionTo: '/campaigns/new',
    })

    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/campaigns/new')
  })
})
