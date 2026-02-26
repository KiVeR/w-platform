import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { computed, onMounted, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { NuxtLinkStub, mockUseI18n } from '../../helpers/stubs'
import { fakeCampaign } from '../../helpers/fixtures'

const mockGet = vi.fn()
const mockApi = { GET: mockGet, POST: vi.fn(), PUT: vi.fn(), DELETE: vi.fn() }

stubAuthGlobals({ $api: mockApi })
vi.stubGlobal('definePageMeta', vi.fn())
const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('computed', computed)
vi.stubGlobal('useRoute', () => ({ params: { id: '1' } }))
mockUseI18n()

const CampaignDetailPage = (await import('@/pages/campaigns/[id].vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  NuxtLink: NuxtLinkStub,
  Button: { template: '<button :disabled="disabled" :data-test="$attrs[\'data-export-button\'] !== undefined ? \'export\' : $attrs[\'data-back-button\'] !== undefined ? \'back\' : $attrs[\'data-duplicate-button\'] !== undefined ? \'duplicate\' : \'btn\'"><slot /></button>', props: ['variant', 'size', 'disabled'] },
  Alert: slotStub,
  AlertTitle: slotStub,
  AlertDescription: slotStub,
  Skeleton: { template: '<div data-skeleton />' },
  CampaignStatusBadge: { template: '<span data-badge>{{ status }}</span>', props: ['status'] },
  CampaignSummaryCard: { template: '<div data-summary-card />', props: ['campaign'] },
  TargetingSummary: { template: '<div data-targeting-summary />', props: ['targeting'] },
  CampaignStatsCard: { template: '<div data-stats-card />', props: ['campaignId'] },
}

describe('campaigns/[id] page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
  })

  function mountPage() {
    return mount(CampaignDetailPage, {
      global: { stubs: baseStubs },
    })
  }

  it('affiche le loading state pendant le fetch', async () => {
    mockGet.mockReturnValue(new Promise(() => {}))
    const wrapper = mountPage()
    await nextTick()
    expect(wrapper.find('[data-detail-loading]').exists()).toBe(true)
  })

  it('affiche les détails de la campagne après chargement', async () => {
    mockGet.mockResolvedValue({
      data: { data: { ...fakeCampaign, targeting: '{"method":"department","departments":["75"]}' } },
      error: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-campaign-name]').text()).toBe('Promo ete 2026')
    expect(wrapper.find('[data-badge]').text()).toBe('sent')
    expect(wrapper.find('[data-summary-card]').exists()).toBe(true)
  })

  it('affiche l\'erreur quand le fetch échoue', async () => {
    mockGet.mockResolvedValue({ data: null, error: { status: 500 } })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-detail-error]').exists()).toBe(true)
  })

  it('affiche le bouton retour qui pointe vers /campaigns', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeCampaign },
      error: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    const backLink = wrapper.findAllComponents(NuxtLinkStub).find(c => c.props('to') === '/campaigns')
    expect(backLink).toBeDefined()
  })

  it('affiche les stats quand le statut est sent', async () => {
    mockGet.mockResolvedValue({
      data: { data: { ...fakeCampaign, status: 'sent' } },
      error: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-stats-card]').exists()).toBe(true)
  })

  it('masque les stats quand le statut est draft', async () => {
    mockGet.mockResolvedValue({
      data: { data: { ...fakeCampaign, status: 'draft' } },
      error: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-stats-card]').exists()).toBe(false)
  })

  it('affiche le bouton export CSV pour campagne envoyée', async () => {
    mockGet.mockResolvedValue({
      data: { data: { ...fakeCampaign, status: 'sent' } },
      error: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-export-button]').exists()).toBe(true)
  })

  it('affiche le bouton dupliquer pour campagne non-draft', async () => {
    mockGet.mockResolvedValue({
      data: { data: { ...fakeCampaign, status: 'sent' } },
      error: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-duplicate-button]').exists()).toBe(true)
  })
})
