import { describe, it, expect, vi } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../../helpers/auth-stubs'
import { mockUseI18n } from '../../../helpers/stubs'

const mockPost = vi.fn()
stubAuthGlobals({ $api: { POST: mockPost, PUT: vi.fn(), GET: vi.fn() } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

const { useCampaignWizardStore } = await import('@/stores/campaignWizard')
const StepType = (await import('@/components/campaigns/wizard/StepType.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: { template: '<div data-card><slot /></div>' },
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardDescription: slotStub,
  Badge: { template: '<span data-badge><slot /></span>' },
}

describe('StepType', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('render 3 cards type', () => {
    const wrapper = mount(StepType, {
      global: { stubs: baseStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('wizard.type.prospection.title')
    expect(text).toContain('wizard.type.fidelisation.title')
    expect(text).toContain('wizard.type.comptage.title')
  })

  it('sélection Prospection met à jour le store', async () => {
    const wrapper = mount(StepType, {
      global: { stubs: baseStubs },
    })

    const cards = wrapper.findAll('[data-card]')
    await cards[0].trigger('click')

    const wizard = useCampaignWizardStore()
    expect(wizard.campaign.type).toBe('prospection')
  })

  it('types désactivés affichent badge "Bientôt"', () => {
    const wrapper = mount(StepType, {
      global: { stubs: baseStubs },
    })

    const badges = wrapper.findAll('[data-badge]')
    expect(badges.length).toBeGreaterThanOrEqual(2)
    expect(wrapper.text()).toContain('wizard.type.comingSoon')
  })
})
