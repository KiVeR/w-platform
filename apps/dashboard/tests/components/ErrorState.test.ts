import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorState from '@/components/shared/ErrorState.vue'

const NuxtLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

function mountErrorState(props: Record<string, unknown> = {}) {
  return mount(ErrorState, {
    props: {
      title: 'Erreur serveur',
      description: 'Une erreur inattendue s\'est produite.',
      ...props,
    },
    global: {
      stubs: { NuxtLink: NuxtLinkStub },
    },
  })
}

describe('ErrorState', () => {
  it('affiche le titre et la description', () => {
    const wrapper = mountErrorState()

    expect(wrapper.text()).toContain('Erreur serveur')
    expect(wrapper.text()).toContain('Une erreur inattendue s\'est produite.')
  })

  it('affiche l\'icône par défaut (ServerCrash)', () => {
    const wrapper = mountErrorState()

    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('affiche le bouton retry avec le label par défaut', () => {
    const wrapper = mountErrorState()

    expect(wrapper.text()).toContain('Réessayer')
  })

  it('émet "retry" au clic sur le bouton retry', async () => {
    const wrapper = mountErrorState()

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('affiche le lien retour quand backTo est fourni', () => {
    const wrapper = mountErrorState({
      backLabel: 'Retour au dashboard',
      backTo: '/',
    })

    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/')
    expect(wrapper.text()).toContain('Retour au dashboard')
  })

  it('n\'affiche pas le lien retour sans backTo', () => {
    const wrapper = mountErrorState()

    expect(wrapper.find('a').exists()).toBe(false)
  })
})
