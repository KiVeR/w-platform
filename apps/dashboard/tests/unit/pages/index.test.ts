import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { computed, onMounted, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeCampaignList, fakeUser } from '../../helpers/fixtures'
import { mockUseI18n } from '../../helpers/stubs'
import { useAuthStore } from '@/stores/auth'

stubAuthGlobals()
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('computed', computed)
mockUseI18n()

const stats = ref({
  activeCount: 4,
  scheduledCount: 2,
  errorCount: 1,
  totalVolume: 3600,
})
const volumeData = ref({ labels: ['09/03', '10/03'], values: [500, 700] })
const activityData = ref({ labels: ['09/03', '10/03'], values: [1, 2] })
const recentCampaigns = ref(fakeCampaignList(2).map((campaign, index) => ({
  id: index + 1,
  name: campaign.name,
  type: campaign.type,
  status: campaign.status as 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed',
  is_demo: false,
  volume_estimated: Number(campaign.volume_estimated),
  scheduled_at: campaign.scheduled_at,
  sent_at: campaign.sent_at,
  created_at: campaign.created_at,
})))
const period = ref<'7d' | '30d' | '90d'>('30d')
const isLoading = ref(false)
const isRecentLoading = ref(false)
const hasError = ref(false)
const refreshDashboard = vi.fn(async () => {})
const setPeriod = vi.fn(async () => {})

vi.stubGlobal('useDashboardStats', () => ({
  stats,
  volumeData,
  activityData,
  recentCampaigns,
  period,
  isLoading,
  isRecentLoading,
  hasError,
  refreshDashboard,
  setPeriod,
}))

const DashboardPage = (await import('@/pages/index.vue')).default

const slotStub = { template: '<div v-bind="$attrs"><slot /></div>' }

describe('index page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())

    const auth = useAuthStore()
    auth.user = { ...fakeUser }

    period.value = '30d'
    isLoading.value = false
    isRecentLoading.value = false
    hasError.value = false
  })

  function mountPage() {
    return mount(DashboardPage, {
      global: {
        stubs: {
          Alert: slotStub,
          AlertTitle: slotStub,
          AlertDescription: slotStub,
          DashboardKpiGrid: { template: '<div data-kpi-grid />', props: ['stats', 'loading'] },
          DashboardChart: { template: '<div data-dashboard-chart />', props: ['volumeData', 'activityData', 'isLoading'] },
          DashboardRecentCampaigns: { template: '<div data-dashboard-recent />', props: ['campaigns', 'loading'] },
          DashboardPeriodSelector: {
            template: '<button data-period-trigger @click="$emit(\'update:modelValue\', \'7d\'); $emit(\'change\', \'7d\')">period</button>',
            props: ['modelValue', 'disabled'],
          },
        },
      },
    })
  }

  it('charge le dashboard au mount et rend les blocs principaux', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(refreshDashboard).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-dashboard-title]').exists()).toBe(true)
    expect(wrapper.find('[data-kpi-grid]').exists()).toBe(true)
    expect(wrapper.find('[data-dashboard-chart]').exists()).toBe(true)
    expect(wrapper.find('[data-dashboard-recent]').exists()).toBe(true)
  })

  it('affiche une alerte quand le dashboard est en erreur', async () => {
    hasError.value = true

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-dashboard-error]').exists()).toBe(true)
  })

  it('relance le setPeriod quand le selecteur change', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.get('[data-period-trigger]').trigger('click')

    expect(setPeriod).toHaveBeenCalledWith('7d')
  })
})
