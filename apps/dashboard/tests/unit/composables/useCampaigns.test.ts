import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeCampaignList, fakePaginationMeta } from '../../helpers/fixtures'
import { useCampaigns } from '@/composables/useCampaigns'

const mockGet = vi.fn()
const mockDelete = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet, DELETE: mockDelete } })
  setActivePinia(createPinia())
})

describe('useCampaigns', () => {
  test('fetchCampaigns appelle GET /campaigns et mappe data + pagination', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeCampaignList(3), meta: fakePaginationMeta },
    })

    const { campaigns, pagination, fetchCampaigns } = useCampaigns()
    await fetchCampaigns()

    expect(mockGet).toHaveBeenCalledWith('/campaigns', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          sort: '-created_at',
          page: 1,
        }),
      }),
    }))
    expect(campaigns.value).toHaveLength(3)
    expect(campaigns.value[0].id).toBe(1) // string '1' → number 1
    expect(campaigns.value[0].name).toBe('Campaign 1')
    expect(pagination.value.total).toBe(42)
    expect(pagination.value.lastPage).toBe(3)
  })

  test('fetchCampaigns passe les query params filtres', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, total: 0, last_page: 1 } },
    })

    const { setFilters, fetchCampaigns } = useCampaigns()
    setFilters({
      statuses: ['draft', 'sent'],
      type: 'prospection',
      search: 'Promo',
      dateFrom: '2026-03-01',
      dateTo: '2026-03-31',
    })
    await fetchCampaigns()

    expect(mockGet).toHaveBeenCalledWith('/campaigns', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          'filter[status][]': ['draft', 'sent'],
          'filter[type]': 'prospection',
          'filter[name]': 'Promo',
          'filter[created_at_from]': '2026-03-01',
          'filter[created_at_to]': '2026-03-31',
        }),
      }),
    }))
  })

  test('setPage change la page et re-fetch', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, current_page: 2 } },
    })

    const { pagination, setPage } = useCampaigns()
    await setPage(2)

    expect(pagination.value.page).toBe(2)
    expect(mockGet).toHaveBeenCalledWith('/campaigns', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({ page: 2 }),
      }),
    }))
  })

  test('setSort toggle desc/asc et re-fetch', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: fakePaginationMeta },
    })

    const { sort, setSort } = useCampaigns()
    expect(sort.value).toBe('-created_at')

    await setSort('created_at')
    expect(sort.value).toBe('created_at') // was -created_at → toggle to asc

    await setSort('created_at')
    expect(sort.value).toBe('-created_at') // toggle back to desc

    await setSort('name')
    expect(sort.value).toBe('-name') // new field → default desc
  })

  test('fetchCampaigns set hasError quand API retourne une erreur', async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { status: 500 } })

    const { hasError, isLoading, fetchCampaigns } = useCampaigns()
    await fetchCampaigns()

    expect(hasError.value).toBe(true)
    expect(isLoading.value).toBe(false)
  })

  test('fetchCampaigns reset hasError sur appel suivant réussi', async () => {
    mockGet.mockResolvedValueOnce({ data: undefined, error: { status: 500 } })
    mockGet.mockResolvedValueOnce({
      data: { data: fakeCampaignList(1), meta: fakePaginationMeta },
    })

    const { hasError, fetchCampaigns } = useCampaigns()

    await fetchCampaigns()
    expect(hasError.value).toBe(true)

    await fetchCampaigns()
    expect(hasError.value).toBe(false)
  })

  test('deleteCampaign appelle DELETE et retourne true si succes', async () => {
    mockDelete.mockResolvedValue({ data: {}, error: undefined })

    const { deleteCampaign } = useCampaigns()
    const result = await deleteCampaign(1)

    expect(mockDelete).toHaveBeenCalledWith('/campaigns/{campaign}', {
      params: { path: { campaign: 1 } },
    })
    expect(result).toBe(true)
  })
})
