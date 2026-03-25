import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeAdminUser } from '../../helpers/fixtures'
import { mockUseI18n } from '../../helpers/stubs'
import type { PartnerAlert } from '@/types/hub'

stubAuthGlobals()
vi.stubGlobal('computed', computed)
mockUseI18n()

const navigateToMock = vi.fn()
vi.stubGlobal('navigateTo', navigateToMock)

let mockRoute = { path: '/hub/dashboard', params: {} as Record<string, string> }
vi.stubGlobal('useRoute', () => mockRoute)
vi.stubGlobal('usePinia', () => undefined)

const { useAuthStore } = await import('@/stores/auth')
const HubAlertsList = (await import('@/components/hub/HubAlertsList.vue')).default

const slotStub = { template: '<div v-bind="$attrs"><slot /></div>' }

function mountAlerts(alerts: PartnerAlert[], loading = false) {
  return mount(HubAlertsList, {
    props: { alerts, loading },
    global: {
      stubs: {
        Card: slotStub,
        CardHeader: slotStub,
        CardContent: slotStub,
        Button: { template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>' },
        Skeleton: { template: '<div data-skeleton />' },
        AlertTriangle: { template: '<span data-icon-alert />' },
        ArrowRight: { template: '<span data-icon-arrow />' },
      },
    },
  })
}

describe('HubAlertsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    mockRoute = { path: '/hub/dashboard', params: {} }

    const auth = useAuthStore()
    auth.setAuth({ access_token: 'tok', refresh_token: 'ref', user: fakeAdminUser })
  })

  it('renders alerts when provided', () => {
    const alerts: PartnerAlert[] = [
      { partnerId: 1, partnerName: 'Partner A', type: 'low-credits', message: '50.00 EUR' },
      { partnerId: 2, partnerName: 'Partner B', type: 'low-credits', message: '10.00 EUR' },
    ]

    const wrapper = mountAlerts(alerts)
    const items = wrapper.findAll('[data-hub-alert-item]')
    expect(items).toHaveLength(2)
  })

  it('displays partner name and message', () => {
    const alerts: PartnerAlert[] = [
      { partnerId: 1, partnerName: 'Acme Corp', type: 'low-credits', message: '75.50 EUR' },
    ]

    const wrapper = mountAlerts(alerts)
    const item = wrapper.find('[data-hub-alert-item]')
    expect(item.text()).toContain('Acme Corp')
    expect(item.text()).toContain('75.50 EUR')
  })

  it('shows empty state when no alerts', () => {
    const wrapper = mountAlerts([])
    expect(wrapper.find('[data-hub-alerts-empty]').exists()).toBe(true)
  })

  it('does not show empty state when alerts exist', () => {
    const alerts: PartnerAlert[] = [
      { partnerId: 1, partnerName: 'X', type: 'low-credits', message: '0 EUR' },
    ]

    const wrapper = mountAlerts(alerts)
    expect(wrapper.find('[data-hub-alerts-empty]').exists()).toBe(false)
  })

  it('shows skeletons when loading', () => {
    const wrapper = mountAlerts([], true)
    const skeletons = wrapper.findAll('[data-skeleton]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('calls enterPartner when enter button is clicked', async () => {
    const alerts: PartnerAlert[] = [
      { partnerId: 42, partnerName: 'Target Partner', type: 'low-credits', message: '10 EUR' },
    ]

    const wrapper = mountAlerts(alerts)
    const enterButton = wrapper.find('[data-hub-alert-enter]')
    await enterButton.trigger('click')

    expect(navigateToMock).toHaveBeenCalledWith('/partners/42/dashboard')
  })

  it('has data-hub-alerts-list attribute', () => {
    const wrapper = mountAlerts([])
    expect(wrapper.find('[data-hub-alerts-list]').exists()).toBe(true)
  })
})
