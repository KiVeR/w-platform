import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  Badge: { template: '<span data-badge v-bind="$attrs"><slot /></span>' },
}

describe('StepType', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  it('renders only the shipped campaign type card', () => {
    const wrapper = mount(StepType, {
      global: { stubs: baseStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('wizard.type.prospection.title')
    expect(text).not.toContain('wizard.type.fidelisation.title')
    expect(text).not.toContain('wizard.type.comptage.title')
    expect(wrapper.findAll('[data-card]')).toHaveLength(1)
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

  it('affiche badge canal SMS sur la carte Prospection', () => {
    const wrapper = mount(StepType, {
      global: { stubs: baseStubs },
    })

    const channelBadge = wrapper.find('[data-channel-badge]')
    expect(channelBadge.exists()).toBe(true)
    expect(channelBadge.text()).toBe('SMS')
  })
})
