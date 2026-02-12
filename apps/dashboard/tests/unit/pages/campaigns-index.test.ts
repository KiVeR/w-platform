import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, onMounted } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { NuxtLinkStub, mockUseI18n } from '../../helpers/stubs'

const mockGet = vi.fn()
const mockDelete = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockApi = { GET: mockGet, POST: mockPost, PUT: mockPut, DELETE: mockDelete }

stubAuthGlobals({ $api: mockApi })
vi.stubGlobal('definePageMeta', vi.fn())
const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('onMounted', onMounted)
mockUseI18n()

const { useCampaignWizardStore } = await import('@/stores/campaignWizard')

const CampaignsIndexPage = (await import('@/pages/campaigns/index.vue')).default

const CampaignDataTableStub = defineComponent({
  name: 'CampaignDataTable',
  template: '<div data-table />',
  emits: ['sort', 'page', 'delete', 'view', 'duplicate', 'retry'],
})

describe('campaigns/index page — QW0 handleDuplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    setActivePinia(createPinia())
    // Default: campaigns list GET returns empty for onMounted fetchCampaigns
    mockGet.mockResolvedValue({
      data: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } },
      error: null,
    })
  })

  function mountPage() {
    return mount(CampaignsIndexPage, {
      global: {
        stubs: {
          NuxtLink: NuxtLinkStub,
          Button: { template: '<button><slot /></button>' },
          CampaignFilters: { template: '<div />' },
          CampaignDataTable: CampaignDataTableStub,
        },
      },
    })
  }

  it('handleDuplicate fetches campaign, inits store, and navigates', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const wizard = useCampaignWizardStore()
    const initSpy = vi.spyOn(wizard, 'initFromCampaign')

    // Mock GET for the specific campaign fetch
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          id: 42,
          type: 'prospection',
          channel: 'sms',
          targeting: {
            method: 'department',
            departments: ['75'],
            postcodes: [],
            address: null,
            lat: null,
            lng: null,
            radius: null,
            gender: null,
            age_min: null,
            age_max: null,
          },
          landing_page_id: 3,
        },
      },
      error: null,
    })

    const dataTable = wrapper.findComponent(CampaignDataTableStub)
    dataTable.vm.$emit('duplicate', 42)
    await flushPromises()

    expect(mockGet).toHaveBeenCalledWith('/campaigns/{campaign}', {
      params: { path: { campaign: 42 } },
    })
    expect(initSpy).toHaveBeenCalledOnce()
    expect(mockNavigateTo).toHaveBeenCalledWith('/campaigns/new')
  })

  it('handleDuplicate does not navigate when fetch fails', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const wizard = useCampaignWizardStore()
    const initSpy = vi.spyOn(wizard, 'initFromCampaign')

    mockGet.mockResolvedValueOnce({ data: null, error: { status: 404 } })

    const dataTable = wrapper.findComponent(CampaignDataTableStub)
    dataTable.vm.$emit('duplicate', 999)
    await flushPromises()

    expect(initSpy).not.toHaveBeenCalled()
    expect(mockNavigateTo).not.toHaveBeenCalledWith('/campaigns/new')
  })
})
