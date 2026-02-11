import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref, onMounted } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../../helpers/auth-stubs'
import { mockUseI18n } from '../../../helpers/stubs'

const mockGet = vi.fn()
stubAuthGlobals({ $api: { GET: mockGet, POST: vi.fn(), PUT: vi.fn() } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('onMounted', onMounted)
mockUseI18n()

vi.mock('@/stores/partner', () => ({
  usePartnerStore: () => ({
    effectivePartnerId: 42,
  }),
}))

vi.mock('@/utils/format', () => ({
  formatCurrency: (n: number) => `${n.toFixed(2)} €`,
}))

const { useCampaignWizardStore } = await import('@/stores/campaignWizard')
const WizardEstimatePanel = (await import('@/components/campaigns/wizard/WizardEstimatePanel.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: { template: '<div data-card><slot /></div>' },
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardContent: slotStub,
  Separator: { template: '<hr />' },
  Skeleton: { template: '<div data-skeleton />' },
  Button: {
    template: '<button data-button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['disabled', 'variant', 'size'],
    emits: ['click'],
  },
  Alert: { template: '<div data-alert><slot /></div>', props: ['variant'] },
  AlertDescription: slotStub,
}

function mountPanel() {
  return mount(WizardEstimatePanel, {
    global: { stubs: baseStubs },
  })
}

describe('WizardEstimatePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    mockGet.mockResolvedValue({
      data: { data: { euro_credits: '100.00' } },
      error: null,
    })
  })

  it('skeleton quand estimate null', () => {
    const wrapper = mountPanel()
    const skeletons = wrapper.findAll('[data-skeleton]')
    expect(skeletons.length).toBeGreaterThanOrEqual(4)
  })

  it('affiche les 4 lignes + coût quand estimate', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 1500, unitPrice: 0.04, totalPrice: 60, smsCount: 2 }

    const wrapper = mountPanel()
    expect(wrapper.find('[data-volume]').text()).toContain('1')
    expect(wrapper.find('[data-sms-count]').text()).toContain('2')
    expect(wrapper.find('[data-total-price]').text()).toContain('60.00')
  })

  it('fetch crédits partenaire au mount', async () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 100, unitPrice: 0.04, totalPrice: 4, smsCount: 1 }

    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(mockGet).toHaveBeenCalledWith('/partners/{partner}', expect.objectContaining({
      params: { path: { partner: 42 } },
    }))
    expect(wrapper.find('[data-credits-remaining]').exists()).toBe(true)
    expect(wrapper.find('[data-credits-remaining]').text()).toContain('100.00')
  })

  it('crédits en rouge si insuffisants', async () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 10000, unitPrice: 0.04, totalPrice: 400, smsCount: 1 }

    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const credits = wrapper.find('[data-credits-remaining]')
    expect(credits.classes()).toContain('text-destructive')
  })

  it('alerte insuffisante visible', async () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 10000, unitPrice: 0.04, totalPrice: 400, smsCount: 1 }

    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-insufficient-alert]').exists()).toBe(true)
  })

  it('pas d\'alerte si crédits suffisants', async () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 100, unitPrice: 0.04, totalPrice: 4, smsCount: 1 }

    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-insufficient-alert]').exists()).toBe(false)
  })

  it('bouton recalculer appelle requestEstimate', async () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 100, unitPrice: 0.04, totalPrice: 4, smsCount: 1 }
    wizard.requestEstimate = vi.fn().mockResolvedValue(undefined)

    const wrapper = mountPanel()
    const btn = wrapper.find('[data-recalculate-button]')
    expect(btn.exists()).toBe(true)

    await btn.trigger('click')
    expect(wizard.requestEstimate).toHaveBeenCalled()
  })

  it('bouton recalculer caché si pas d\'estimate', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-recalculate-button]').exists()).toBe(false)
  })
})
