import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { onMounted, onBeforeUnmount } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { mockUseI18n } from '../../helpers/stubs'

const mockApi = {
  POST: vi.fn(),
  GET: vi.fn(),
  PUT: vi.fn(),
}

// Mock vue-sonner
vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

import { toast } from 'vue-sonner'

let mockRouteQuery: Record<string, string> = {}

stubAuthGlobals({ $api: mockApi })
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('onBeforeUnmount', onBeforeUnmount)
vi.stubGlobal('useRoute', () => ({ query: mockRouteQuery }))
mockUseI18n()

const { useCampaignWizardStore } = await import('@/stores/campaignWizard')

const CampaignsNewPage = (await import('@/pages/campaigns/new.vue')).default

describe('campaigns/new page — QW0 isPreFilled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockRouteQuery = {}
    setActivePinia(createPinia())
  })

  function mountPage() {
    return mount(CampaignsNewPage, {
      global: {
        stubs: {
          CampaignWizard: { template: '<div data-wizard />' },
        },
      },
    })
  }

  it('does NOT reset store when isPreFilled is true, and consumes the flag', async () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.type = 'fidelisation'
    wizard.campaign.targeting.departments = ['75', '13']
    wizard.isPreFilled = true

    mountPage()
    await flushPromises()

    expect(wizard.campaign.type).toBe('fidelisation')
    expect(wizard.campaign.targeting.departments).toEqual(['75', '13'])
    expect(wizard.isPreFilled).toBe(false)
  })

  it('resets store when isPreFilled is false', async () => {
    const wizard = useCampaignWizardStore()
    wizard.campaign.type = 'fidelisation'
    wizard.campaign.name = 'Test campaign'
    wizard.isPreFilled = false

    mountPage()
    await flushPromises()

    expect(wizard.campaign.type).toBe('prospection')
    expect(wizard.campaign.name).toBe('')
  })

  it('normal new wizard flow works (non-regression)', async () => {
    const wizard = useCampaignWizardStore()

    mountPage()
    await flushPromises()

    expect(wizard.campaign.targeting.method).toBe('postcode')
    expect(wizard.campaign.targeting.departments).toEqual([])
    expect(wizard.campaignId).toBeNull()
    expect(wizard.isPreFilled).toBe(false)
  })
})

describe('campaigns/new page — draft deep link', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockRouteQuery = {}
    setActivePinia(createPinia())
  })

  function mountPage() {
    return mount(CampaignsNewPage, {
      global: {
        stubs: {
          CampaignWizard: { template: '<div data-wizard />' },
        },
      },
    })
  }

  it('loads draft from ?draft=X query param', async () => {
    mockRouteQuery = { draft: '42' }

    mockApi.GET.mockResolvedValueOnce({
      data: {
        data: {
          id: '42',
          type: 'prospection',
          channel: 'sms',
          name: 'Mon brouillon',
          sender: 'WELLPACK',
          message: 'Hello!',
          targeting: { method: 'department', departments: ['75'], postcodes: [], address: null, lat: null, lng: null, radius: null, gender: null, age_min: null, age_max: null },
          scheduled_at: null,
          landing_page_id: null,
          is_demo: false,
          additional_phone: null,
        },
      },
      error: null,
    })

    mountPage()
    await flushPromises()

    const wizard = useCampaignWizardStore()
    expect(wizard.campaignId).toBe(42)
    expect(wizard.campaign.name).toBe('Mon brouillon')
    expect(wizard.campaign.message).toBe('Hello!')
    expect(toast.success).toHaveBeenCalledWith('wizard.draftLoaded')
  })

  it('does NOT load draft when no query param', async () => {
    mockRouteQuery = {}

    mountPage()
    await flushPromises()

    expect(mockApi.GET).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('shows toast after successful draft load', async () => {
    mockRouteQuery = { draft: '7' }

    mockApi.GET.mockResolvedValueOnce({
      data: {
        data: {
          id: '7',
          type: 'prospection',
          channel: 'sms',
          name: 'Test toast',
          sender: '',
          message: '',
          targeting: { method: 'department', departments: [], postcodes: [], address: null, lat: null, lng: null, radius: null, gender: null, age_min: null, age_max: null },
          scheduled_at: null,
          landing_page_id: null,
          is_demo: false,
          additional_phone: null,
        },
      },
      error: null,
    })

    mountPage()
    await flushPromises()

    expect(toast.success).toHaveBeenCalledWith('wizard.draftLoaded')
  })
})
