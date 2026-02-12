import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref, onMounted } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
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
  Badge: { template: '<span v-bind="$attrs"><slot /></span>', inheritAttrs: true },
  TargetingScoreGauge: { template: '<div data-targeting-gauge />', props: ['volume'] },
  PricingTierNudge: { template: '<div data-pricing-nudge-wrapper />', props: ['nextTier', 'currentVolume'] },
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

  it('bouton "Lancer le comptage" quand estimate null', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-count-button]').exists()).toBe(true)
    expect(wrapper.text()).toContain('wizard.estimate.launchCount')
  })

  it('bouton comptage toujours activé par défaut', () => {
    const wrapper = mountPanel()
    const btn = wrapper.find('[data-count-button]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('bouton comptage appelle requestEstimate', async () => {
    const wizard = useCampaignWizardStore()
    wizard.requestEstimate = vi.fn().mockResolvedValue(undefined)

    const wrapper = mountPanel()
    await wrapper.find('[data-count-button]').trigger('click')
    await flushPromises()

    expect(wizard.requestEstimate).toHaveBeenCalled()
  })

  it('affiche les 4 lignes + coût quand estimate', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 1500, unitPrice: 0.04, totalPrice: 60, smsCount: 2, nextTier: null }

    const wrapper = mountPanel()
    expect(wrapper.find('[data-volume]').text()).toContain('1')
    expect(wrapper.find('[data-sms-count]').text()).toContain('2')
    expect(wrapper.find('[data-total-price]').text()).toContain('60.00')
  })

  it('fetch crédits partenaire au mount', async () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 100, unitPrice: 0.04, totalPrice: 4, smsCount: 1, nextTier: null }

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
    wizard.estimate = { volume: 10000, unitPrice: 0.04, totalPrice: 400, smsCount: 1, nextTier: null }

    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const credits = wrapper.find('[data-credits-remaining]')
    expect(credits.classes()).toContain('text-destructive')
  })

  it('alerte insuffisante visible', async () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 10000, unitPrice: 0.04, totalPrice: 400, smsCount: 1, nextTier: null }

    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-insufficient-alert]').exists()).toBe(true)
  })

  it('pas d\'alerte si crédits suffisants', async () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 100, unitPrice: 0.04, totalPrice: 4, smsCount: 1, nextTier: null }

    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-insufficient-alert]').exists()).toBe(false)
  })

  it('bouton recalculer appelle requestEstimate', async () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 100, unitPrice: 0.04, totalPrice: 4, smsCount: 1, nextTier: null }
    wizard.requestEstimate = vi.fn().mockResolvedValue(undefined)

    const wrapper = mountPanel()
    const btn = wrapper.find('[data-recalculate-button]')
    expect(btn.exists()).toBe(true)

    await btn.trigger('click')
    await flushPromises()
    expect(wizard.requestEstimate).toHaveBeenCalled()
  })

  it('bouton recalculer caché si pas d\'estimate', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-recalculate-button]').exists()).toBe(false)
  })

  it('pas de bouton comptage quand estimate existe', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 100, unitPrice: 0.04, totalPrice: 4, smsCount: 1, nextTier: null }

    const wrapper = mountPanel()
    expect(wrapper.find('[data-count-button]').exists()).toBe(false)
  })

  it('bouton comptage toujours visible sans estimate', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-count-button]').exists()).toBe(true)
  })

  it('pricing masqué quand totalPrice null', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 500, unitPrice: null, totalPrice: null, smsCount: 1, nextTier: null }

    const wrapper = mountPanel()
    expect(wrapper.find('[data-total-price]').exists()).toBe(false)
    expect(wrapper.text()).toContain('wizard.estimate.selectPartner')
  })

  // QW4 — Visites estimées
  it('affiche ~135 visites quand volume = 4500', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 4500, unitPrice: 0.04, totalPrice: 180, smsCount: 1, nextTier: null }

    const wrapper = mountPanel()
    const visits = wrapper.find('[data-estimated-visits]')
    expect(visits.exists()).toBe(true)
    expect(visits.text()).toContain('~135')
  })

  it('affiche ~0 visites quand volume = 0', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 0, unitPrice: 0.04, totalPrice: 0, smsCount: 1, nextTier: null }

    const wrapper = mountPanel()
    const visits = wrapper.find('[data-estimated-visits]')
    expect(visits.exists()).toBe(true)
    expect(visits.text()).toContain('~0')
  })

  it('n\'affiche PAS les visites si estimate est null', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-estimated-visits]').exists()).toBe(false)
  })

  it('tooltip présent sur la ligne des visites', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 4500, unitPrice: 0.04, totalPrice: 180, smsCount: 1, nextTier: null }

    const wrapper = mountPanel()
    const visits = wrapper.find('[data-estimated-visits]')
    expect(visits.attributes('title')).toBe('wizard.estimate.estimatedVisitsTooltip')
  })

  // QW7 — Badge stale
  it('badge stale visible quand estimateStale = true', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 1000, unitPrice: 0.04, totalPrice: 40, smsCount: 1, nextTier: null }
    wizard.estimateStale = true

    const wrapper = mountPanel()
    expect(wrapper.find('[data-stale-badge]').exists()).toBe(true)
  })

  // S3.2 — Targeting score gauge
  it('jauge ciblage visible quand estimate existe', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 5000, unitPrice: 0.04, totalPrice: 200, smsCount: 1 }

    const wrapper = mountPanel()
    expect(wrapper.find('[data-targeting-gauge]').exists()).toBe(true)
  })

  it('jauge ciblage masquée quand estimate null', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-targeting-gauge]').exists()).toBe(false)
  })

  it('badge stale absent quand estimateStale = false', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 1000, unitPrice: 0.04, totalPrice: 40, smsCount: 1, nextTier: null }
    wizard.estimateStale = false

    const wrapper = mountPanel()
    expect(wrapper.find('[data-stale-badge]').exists()).toBe(false)
  })

  // S3.4 — Pricing tier nudge
  it('nudge visible quand nextTier présent', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = {
      volume: 4000,
      unitPrice: 0.04,
      totalPrice: 160,
      smsCount: 1,
      nextTier: { volumeThreshold: 5001, unitPrice: 0.033, savingsPercent: 17.5 },
    }

    const wrapper = mountPanel()
    expect(wrapper.find('[data-pricing-nudge-wrapper]').exists()).toBe(true)
  })

  it('nudge masqué quand nextTier null', () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = { volume: 4000, unitPrice: 0.04, totalPrice: 160, smsCount: 1, nextTier: null }

    const wrapper = mountPanel()
    expect(wrapper.find('[data-pricing-nudge-wrapper]').exists()).toBe(false)
  })

  it('nudge masqué quand crédits insuffisants', async () => {
    const wizard = useCampaignWizardStore()
    wizard.estimate = {
      volume: 10000,
      unitPrice: 0.04,
      totalPrice: 400,
      smsCount: 1,
      nextTier: { volumeThreshold: 15001, unitPrice: 0.033, savingsPercent: 17.5 },
    }

    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    // euroCredits = 100 (mock), totalPrice = 400 → insufficient
    expect(wrapper.find('[data-pricing-nudge-wrapper]').exists()).toBe(false)
  })
})
