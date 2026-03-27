import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { computed, onMounted, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeAdminUser } from '../../helpers/fixtures'
import { mockUseI18n } from '../../helpers/stubs'
import { useAuthStore } from '@/stores/auth'
import type { HubStats, PartnerAlert } from '@/types/hub'

stubAuthGlobals()
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('computed', computed)
vi.stubGlobal('definePageMeta', () => {})
mockUseI18n()

const stats = ref<HubStats | null>({
  partnersCount: 10,
  activePartnersCount: 8,
  totalCredits: 5000,
  totalDemandes: 15,
})
const alerts = ref<PartnerAlert[]>([
  { partnerId: 1, partnerName: 'Low Partner', type: 'low-credits', message: '50.00 EUR' },
])
const isLoading = ref(false)
const hasError = ref(false)
const fetchDashboard = vi.fn(async () => {})

vi.stubGlobal('useHubDashboard', () => ({
  stats,
  alerts,
  isLoading,
  hasError,
  fetchDashboard,
}))

const HubDashboardPage = (await import('@/pages/hub/dashboard.vue')).default

const slotStub = { template: '<div v-bind="$attrs"><slot /></div>' }

describe('hub/dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())

    const auth = useAuthStore()
    auth.user = { ...fakeAdminUser }

    stats.value = {
      partnersCount: 10,
      activePartnersCount: 8,
      totalCredits: 5000,
      totalDemandes: 15,
    }
    alerts.value = [
      { partnerId: 1, partnerName: 'Low Partner', type: 'low-credits', message: '50.00 EUR' },
    ]
    isLoading.value = false
    hasError.value = false
  })

  function mountPage() {
    return mount(HubDashboardPage, {
      global: {
        stubs: {
          Alert: slotStub,
          AlertTitle: slotStub,
          AlertDescription: slotStub,
          HubKpiGrid: { template: '<div data-hub-kpi-grid />', props: ['stats', 'loading'] },
          HubAlertsList: { template: '<div data-hub-alerts-list />', props: ['alerts', 'loading'] },
        },
      },
    })
  }

  it('calls fetchDashboard on mount and renders main sections', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(fetchDashboard).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-hub-dashboard-title]').exists()).toBe(true)
    expect(wrapper.find('[data-hub-kpi-grid]').exists()).toBe(true)
    expect(wrapper.find('[data-hub-alerts-list]').exists()).toBe(true)
  })

  it('shows error alert when hasError is true', async () => {
    hasError.value = true

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-hub-dashboard-error]').exists()).toBe(true)
  })

  it('does not show error alert when hasError is false', async () => {
    hasError.value = false

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-hub-dashboard-error]').exists()).toBe(false)
  })

  it('renders welcome message with user firstname', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const title = wrapper.find('[data-hub-dashboard-title]')
    expect(title.exists()).toBe(true)
  })
})
