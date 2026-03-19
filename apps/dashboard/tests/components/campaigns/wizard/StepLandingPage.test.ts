import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../../helpers/auth-stubs'
import { mockUseI18n, NuxtLinkStub } from '../../../helpers/stubs'
import { fakeLandingPageList } from '../../../helpers/fixtures'

const mockGet = vi.fn()
stubAuthGlobals({ $api: { POST: vi.fn(), PUT: vi.fn(), GET: mockGet } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

const mockFetchLandingPages = vi.fn()
const mockLandingPages = ref(fakeLandingPageList(3))
const mockIsLoading = ref(false)
const mockHasError = ref(false)

vi.mock('@/composables/useLandingPages', () => ({
  useLandingPages: () => ({
    landingPages: mockLandingPages,
    isLoading: mockIsLoading,
    hasError: mockHasError,
    fetchLandingPages: mockFetchLandingPages,
  }),
}))

const { useCampaignWizardStore } = await import('@/stores/campaignWizard')
const StepLandingPage = (await import('@/components/campaigns/wizard/StepLandingPage.vue')).default

const slotStub = { template: '<div><slot /></div>' }

const baseStubs = {
  Card: { template: '<div data-card><slot /></div>' },
  CardHeader: slotStub,
  CardTitle: slotStub,
  CardContent: slotStub,
  CardDescription: slotStub,
  Badge: { template: '<span data-badge><slot /></span>' },
  Button: { template: '<button data-button @click="$emit(\'click\')"><slot /></button>', emits: ['click'] },
  NuxtLink: NuxtLinkStub,
  EmptyState: { template: '<div data-empty-state />' },
}

describe('StepLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    mockLandingPages.value = fakeLandingPageList(3)
    mockIsLoading.value = false
    mockHasError.value = false
  })

  it('renders 2 mode cards: with LP and without LP', () => {
    const wrapper = mount(StepLandingPage, {
      global: { stubs: baseStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('wizard.landingPage.withLp')
    expect(text).toContain('wizard.landingPage.withoutLp')
  })

  it('mode "none" sets landing_page_id to null', async () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.landing_page_id = 1

    const wrapper = mount(StepLandingPage, {
      global: { stubs: baseStubs },
    })

    await wrapper.find('[data-mode-none]').trigger('click')
    expect(wizard.campaign.landing_page_id).toBeNull()
  })

  it('mode "with" fetches landing pages on activation', async () => {
    const wrapper = mount(StepLandingPage, {
      global: { stubs: baseStubs },
    })

    await wrapper.find('[data-mode-with]').trigger('click')
    expect(mockFetchLandingPages).toHaveBeenCalled()
  })

  it('clicking LP card sets landing_page_id', async () => {
    const wizard = useCampaignWizardStore()

    const wrapper = mount(StepLandingPage, {
      global: { stubs: baseStubs },
    })

    // Activate "with" mode first
    await wrapper.find('[data-mode-with]').trigger('click')
    await wrapper.vm.$nextTick()

    const lpCards = wrapper.findAll('[data-lp-card]')
    expect(lpCards.length).toBeGreaterThan(0)

    await lpCards[0].trigger('click')
    expect(wizard.campaign.landing_page_id).toBe(1)
  })

  it('selected LP card has active styling', async () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.landing_page_id = 2

    const wrapper = mount(StepLandingPage, {
      global: { stubs: baseStubs },
    })

    // Activate "with" mode
    await wrapper.find('[data-mode-with]').trigger('click')
    await wrapper.vm.$nextTick()

    const lpCards = wrapper.findAll('[data-lp-card]')
    const selectedCard = lpCards.find(c => c.text().includes('Landing Page 2'))
    expect(selectedCard?.classes().some(c => c.includes('border-primary') || c.includes('ring'))).toBe(true)
  })

  it('shows empty state when no LPs available', async () => {
    mockLandingPages.value = []

    const wrapper = mount(StepLandingPage, {
      global: { stubs: baseStubs },
    })

    await wrapper.find('[data-mode-with]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-empty-state]').exists()).toBe(true)
  })

  it('shows that landing page creation is managed externally', async () => {
    const wrapper = mount(StepLandingPage, {
      global: { stubs: baseStubs },
    })

    await wrapper.find('[data-mode-with]').trigger('click')
    await wrapper.vm.$nextTick()

    const helper = wrapper.find('[data-lp-managed-externally]')
    expect(helper.exists()).toBe(true)
    expect(helper.text()).toContain('wizard.landingPage.managedExternally')
  })

  it('refresh button triggers fetchLandingPages', async () => {
    const wrapper = mount(StepLandingPage, {
      global: { stubs: baseStubs },
    })

    await wrapper.find('[data-mode-with]').trigger('click')
    await wrapper.vm.$nextTick()

    mockFetchLandingPages.mockClear()
    await wrapper.find('[data-refresh-button]').trigger('click')
    expect(mockFetchLandingPages).toHaveBeenCalledTimes(1)
  })

  it('LP card shows initials avatar', async () => {
    const wrapper = mount(StepLandingPage, {
      global: { stubs: baseStubs },
    })

    await wrapper.find('[data-mode-with]').trigger('click')
    await wrapper.vm.$nextTick()

    const avatar = wrapper.find('[data-lp-avatar]')
    expect(avatar.exists()).toBe(true)
    expect(avatar.text()).toBe('LP')
  })

  it('LP card shows formatted date', async () => {
    const wrapper = mount(StepLandingPage, {
      global: { stubs: baseStubs },
    })

    await wrapper.find('[data-mode-with]').trigger('click')
    await wrapper.vm.$nextTick()

    const dateEl = wrapper.find('[data-lp-date]')
    expect(dateEl.exists()).toBe(true)
    expect(dateEl.text()).toContain('2026')
  })

  it('selected LP has checkmark indicator', async () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.landing_page_id = 1

    const wrapper = mount(StepLandingPage, {
      global: { stubs: baseStubs },
    })

    await wrapper.find('[data-mode-with]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-lp-selected]').exists()).toBe(true)
  })
})
