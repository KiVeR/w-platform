import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { NuxtLinkStub, mockUseI18n } from '../../helpers/stubs'
import { fakeAdminUser, fakeCampaign, fakeUser } from '../../helpers/fixtures'
import { useAuthStore } from '@/stores/auth'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockApi = { GET: mockGet, POST: mockPost, PUT: vi.fn(), DELETE: vi.fn() }

stubAuthGlobals({ $api: mockApi })
vi.stubGlobal('definePageMeta', vi.fn())
const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('useRoute', () => ({ params: { id: '1' } }))
vi.stubGlobal('useScopedNavigation', () => ({ scopedRoute: (p: string) => p, hubRoute: (p: string) => p, enterPartner: vi.fn(), exitToHub: vi.fn() }))
mockUseI18n()

const stats = ref({
  sent: 12000,
  delivered: 11500,
  undeliverable: 300,
  rejected: 100,
  expired: 100,
  stop: 50,
  clicks: 1200,
  deliverability_rate: 0.958,
  ctr: 0.104,
})
const statsIsLoading = ref(false)
const statsErrorType = ref<null | 'not_yet' | 'provider' | 'only_sent'>(null)
const statsAvailableAt = ref<string | null>(null)
const fetchStats = vi.fn()

const isCancelling = ref(false)
const cancelError = ref<string | null>(null)
const cancelCampaign = vi.fn(async () => true)

vi.mock('@/composables/useCampaignStats', () => ({
  useCampaignStats: () => ({
    stats,
    isLoading: statsIsLoading,
    errorType: statsErrorType,
    availableAt: statsAvailableAt,
    fetchStats,
  }),
}))

vi.mock('@/composables/useCampaignActions', () => ({
  useCampaignActions: () => ({
    isCancelling,
    cancelError,
    cancelCampaign,
  }),
}))

const CampaignDetailPage = (await import('@/pages/campaigns/[id].vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  NuxtLink: NuxtLinkStub,
  Button: { template: '<button v-bind="$attrs" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>', props: ['variant', 'size', 'disabled'] },
  Alert: slotStub,
  AlertTitle: slotStub,
  AlertDescription: slotStub,
  Skeleton: { template: '<div data-skeleton />' },
  CampaignStatusBadge: { template: '<span data-badge>{{ status }}</span>', props: ['status'] },
  ContextBar: { template: '<div data-context-bar />', props: ['campaign'] },
  SectionMessage: { template: '<div data-section-message />', props: ['campaign', 'open'] },
  SectionTargeting: { template: '<div data-section-targeting />', props: ['targeting', 'open'] },
  SectionRecipients: { template: '<div data-section-recipients />', props: ['campaignId', 'open'] },
  SectionTimeline: { template: '<div data-section-timeline />', props: ['campaignId', 'open'] },
  SectionLogs: { template: '<div data-section-logs />', props: ['campaignId', 'open'] },
  PerformancePanel: { template: '<div data-performance-panel />', props: ['campaignStatus', 'stats', 'isLoading'] },
  CampaignActionsPanel: {
    template: `
      <div v-if="!$attrs.hidden" data-actions-panel>
        <button v-if="showDuplicate" data-duplicate-button @click="$emit('duplicate')">duplicate</button>
        <button v-if="showExport" data-export-button @click="$emit('export')">export</button>
        <button v-if="showCancel" data-cancel-button @click="$emit('cancel')">cancel</button>
      </div>
    `,
    props: ['campaign', 'showDuplicate', 'showExport', 'showCancel', 'isExporting', 'isCancelling', 'cancelError'],
  },
  SmsPreview: { template: '<div data-sms-preview>{{ sender }}|{{ message }}</div>', props: ['sender', 'message'] },
  Card: slotStub,
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardDescription: slotStub,
  CardContent: slotStub,
  DropdownMenu: slotStub,
  DropdownMenuTrigger: slotStub,
  DropdownMenuContent: slotStub,
  DropdownMenuItem: { template: '<button v-bind="$attrs" @click="$emit(\'select\')"><slot /></button>' },
  Sheet: slotStub,
  SheetTrigger: slotStub,
  SheetContent: slotStub,
  SheetHeader: slotStub,
  SheetTitle: slotStub,
  SheetDescription: slotStub,
}

describe('campaigns/[id] page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('useMediaQuery', (query: string) => ref(query.includes('max-width') ? false : true))

    const auth = useAuthStore()
    auth.user = { ...fakeUser }

    stats.value = {
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
    statsIsLoading.value = false
    statsErrorType.value = null
    statsAvailableAt.value = null
    isCancelling.value = false
    cancelError.value = null
    cancelCampaign.mockResolvedValue(true)
    fetchStats.mockResolvedValue(undefined)
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
    expect(wrapper.find('[data-context-bar]').exists()).toBe(true)
    expect(wrapper.find('[data-section-message]').exists()).toBe(true)
    expect(wrapper.find('[data-section-targeting]').exists()).toBe(true)
    expect(wrapper.find('[data-section-timeline]').exists()).toBe(true)
    expect(wrapper.find('[data-actions-panel]').exists()).toBe(true)
  })

  it('affiche l erreur quand le fetch echoue', async () => {
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

  it('affiche le panneau performance quand le statut est sent', async () => {
    mockGet.mockResolvedValue({
      data: { data: { ...fakeCampaign, status: 'sent' } },
      error: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    expect(fetchStats).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-performance-panel]').exists()).toBe(true)
  })

  it('masque le panneau performance quand le statut est draft', async () => {
    mockGet.mockResolvedValue({
      data: { data: { ...fakeCampaign, status: 'draft' } },
      error: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-performance-panel]').exists()).toBe(false)
  })

  it('duplique la campagne depuis le panneau actions', async () => {
    mockGet.mockResolvedValue({
      data: { data: { ...fakeCampaign, status: 'sent' } },
      error: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-duplicate-button]').trigger('click')

    expect(mockNavigateTo).toHaveBeenCalledWith('/campaigns/new')
  })

  it('exporte la campagne depuis le panneau actions', async () => {
    mockGet.mockResolvedValue({
      data: { data: { ...fakeCampaign, status: 'sent' } },
      error: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-export-button]').trigger('click')

    expect(mockGet).toHaveBeenCalledWith('/campaigns/{campaign}/export', {
      params: { path: { campaign: 1 } },
      parseAs: 'blob',
    })
  })

  it('affiche les destinataires pour un utilisateur avec permission view campaigns', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeCampaign },
      error: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-section-recipients]').exists()).toBe(true)
    expect(wrapper.find('[data-section-logs]').exists()).toBe(false)
  })

  it('affiche les logs pour un admin', async () => {
    const auth = useAuthStore()
    auth.user = { ...fakeAdminUser }
    mockGet.mockResolvedValue({
      data: { data: fakeCampaign },
      error: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-section-logs]').exists()).toBe(true)
  })

  it('utilise SmsPreview avec le sender et le message', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeCampaign },
      error: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-sms-preview]').text()).toContain('WELLPACK')
    expect(wrapper.find('[data-sms-preview]').text()).toContain('Profitez de -20% cet ete !')
  })

  it('annule la campagne depuis le panneau actions', async () => {
    mockGet.mockResolvedValue({
      data: { data: { ...fakeCampaign, status: 'scheduled' } },
      error: null,
    })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-cancel-button]').trigger('click')

    expect(cancelCampaign).toHaveBeenCalledTimes(1)
  })

})
