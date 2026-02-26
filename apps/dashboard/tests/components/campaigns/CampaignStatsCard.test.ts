import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed, onMounted, nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { stubAuthGlobals, localStorageMock } from '../../helpers/auth-stubs'
import { mockUseI18n } from '../../helpers/stubs'

const mockGet = vi.fn()

stubAuthGlobals({ $api: { GET: mockGet } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('onMounted', onMounted)
mockUseI18n()

const CampaignStatsCard = (await import('@/components/campaigns/CampaignStatsCard.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: slotStub,
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardContent: slotStub,
  Alert: { template: '<div :data-variant="variant"><slot /></div>', props: ['variant'] },
  AlertDescription: slotStub,
  Skeleton: { template: '<div data-skeleton />' },
  Clock: { template: '<span />' },
  AlertTriangle: { template: '<span />' },
  ServerCrash: { template: '<span />' },
}

const fakeStats = {
  sent: 12000,
  delivered: 11500,
  undeliverable: 300,
  rejected: 100,
  expired: 100,
  stop: 50,
  clicks: 1200,
  deliverability_rate: 0.958,
  ctr: 0.104,
}

describe('CampaignStatsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  function mountComponent(campaignId = 1) {
    return mount(CampaignStatsCard, {
      props: { campaignId },
      global: { stubs: baseStubs },
    })
  }

  it('affiche le skeleton pendant le chargement', async () => {
    mockGet.mockReturnValue(new Promise(() => {})) // never resolves
    const wrapper = mountComponent()
    await nextTick()
    expect(wrapper.find('[data-stats-loading]').exists()).toBe(true)
  })

  it('affiche les stats après chargement réussi', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeStats },
      error: null,
    })
    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.find('[data-stats-content]').exists()).toBe(true)
    expect(wrapper.text()).toContain('campaigns.detail.stats.sent')
    expect(wrapper.text()).toContain('campaigns.detail.stats.delivered')
    expect(wrapper.text()).toContain('campaigns.detail.stats.clicks')
    expect(wrapper.text()).toContain('campaigns.detail.stats.stop')
  })

  it('gère l\'erreur 422 — stats pas encore disponibles', async () => {
    mockGet.mockResolvedValue({
      data: null,
      error: { message: 'Stats not yet available.', available_at: '2026-02-08T09:02:00Z' },
      response: { status: 422 },
    })
    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.find('[data-stats-not-yet]').exists()).toBe(true)
  })

  it('gère l\'erreur 422 — only sent campaigns', async () => {
    mockGet.mockResolvedValue({
      data: null,
      error: { message: 'Stats only available for sent campaigns.' },
      response: { status: 422 },
    })
    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.find('[data-stats-only-sent]').exists()).toBe(true)
  })

  it('gère l\'erreur 503 — provider indisponible', async () => {
    mockGet.mockResolvedValue({
      data: null,
      error: { message: 'Stats retrieval failed.' },
      response: { status: 503 },
    })
    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.find('[data-stats-provider-error]').exists()).toBe(true)
  })
})
