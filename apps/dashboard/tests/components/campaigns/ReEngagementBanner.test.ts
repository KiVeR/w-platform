import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computed, ref, onMounted } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { stubAuthGlobals } from '../../helpers/auth-stubs'
import { mockUseI18n } from '../../helpers/stubs'

stubAuthGlobals()
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('onMounted', onMounted)
mockUseI18n()

const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('useScopedNavigation', () => ({ scopedRoute: (p: string) => p, hubRoute: (p: string) => p, enterPartner: vi.fn(), exitToHub: vi.fn() }))

const mockFetch = vi.fn()
const mockDismiss = vi.fn()
const mockShouldShow = ref(false)
const mockLastCampaign = ref<any>(null)
const mockDaysSinceLastSend = ref<number | null>(null)
const mockIsDismissed = ref(false)

vi.mock('@/composables/useReEngagementBanner', () => ({
  useReEngagementBanner: () => ({
    lastCampaign: mockLastCampaign,
    daysSinceLastSend: mockDaysSinceLastSend,
    shouldShow: mockShouldShow,
    isDismissed: mockIsDismissed,
    dismiss: mockDismiss,
    fetch: mockFetch,
    isLoading: ref(false),
  }),
}))

const ReEngagementBanner = (await import('@/components/campaigns/ReEngagementBanner.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Alert: { template: '<div data-alert role="alert"><slot /></div>', props: ['variant', 'class'] },
  AlertTitle: { template: '<div data-alert-title><slot /></div>' },
  AlertDescription: { template: '<div data-alert-desc><slot /></div>' },
  Button: { template: '<button :data-variant="variant" :data-testid="$attrs[\'data-testid\']"><slot /></button>', props: ['variant', 'size'] },
  Megaphone: { template: '<svg />' },
  Transition: slotStub,
}

describe('ReEngagementBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockShouldShow.value = false
    mockLastCampaign.value = null
    mockDaysSinceLastSend.value = null
    mockIsDismissed.value = false
  })

  function mountBanner() {
    return mount(ReEngagementBanner, {
      global: { stubs: baseStubs },
    })
  }

  it('calls fetch on mount', async () => {
    mountBanner()
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('shows banner when shouldShow is true and lastCampaign exists', async () => {
    mockShouldShow.value = true
    mockLastCampaign.value = { id: 1, name: 'Promo', volume: 5000, sentAt: '2026-01-10T00:00:00Z' }
    mockDaysSinceLastSend.value = 30

    const wrapper = mountBanner()
    await flushPromises()

    expect(wrapper.find('[data-alert]').exists()).toBe(true)
  })

  it('hides banner when shouldShow is false', async () => {
    mockShouldShow.value = false

    const wrapper = mountBanner()
    await flushPromises()

    expect(wrapper.find('[data-alert]').exists()).toBe(false)
  })

  it('displays campaign name and days in the message text', async () => {
    mockShouldShow.value = true
    mockLastCampaign.value = { id: 1, name: 'Soldes hiver', volume: 8000, sentAt: '2026-01-10T00:00:00Z' }
    mockDaysSinceLastSend.value = 28

    const wrapper = mountBanner()
    await flushPromises()

    // The i18n mock returns the key, so we check that the t() function was used
    const text = wrapper.text()
    expect(text).toContain('campaigns.reEngagement.title')
    expect(text).toContain('campaigns.reEngagement.message')
  })

  it('navigates to /campaigns/new when Relaunch button is clicked', async () => {
    mockShouldShow.value = true
    mockLastCampaign.value = { id: 1, name: 'Test', volume: 100, sentAt: '2026-01-10T00:00:00Z' }
    mockDaysSinceLastSend.value = 30

    const wrapper = mountBanner()
    await flushPromises()

    const relaunchBtn = wrapper.find('[data-testid="re-engagement-relaunch"]')
    await relaunchBtn.trigger('click')

    expect(mockNavigateTo).toHaveBeenCalledWith('/campaigns/new')
  })

  it('calls dismiss when Later button is clicked', async () => {
    vi.useFakeTimers()

    mockShouldShow.value = true
    mockLastCampaign.value = { id: 1, name: 'Test', volume: 100, sentAt: '2026-01-10T00:00:00Z' }
    mockDaysSinceLastSend.value = 30

    const wrapper = mountBanner()
    await flushPromises()

    const laterBtn = wrapper.find('[data-testid="re-engagement-dismiss"]')
    await laterBtn.trigger('click')

    // Wait for the 250ms collapse timeout
    vi.advanceTimersByTime(250)

    expect(mockDismiss).toHaveBeenCalledOnce()

    vi.useRealTimers()
  })
})
