import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeRecipientList, fakeRecipientPaginationMeta } from '../../helpers/fixtures'
import { useCampaignRecipients } from '@/composables/useCampaignRecipients'

const mockGet = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet } })
  setActivePinia(createPinia())
})

describe('useCampaignRecipients', () => {
  test('fetchRecipients appelle GET et mappe data + pagination', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeRecipientList(3), meta: fakeRecipientPaginationMeta },
    })

    const { recipients, pagination, fetchRecipients } = useCampaignRecipients(42)
    await fetchRecipients()

    expect(mockGet).toHaveBeenCalledWith('/campaigns/{campaign}/recipients', expect.objectContaining({
      params: expect.objectContaining({
        path: { campaign: 42 },
        query: expect.objectContaining({ sort: '-delivered_at', page: 1, per_page: 15 }),
      }),
    }))
    expect(recipients.value).toHaveLength(3)
    expect(recipients.value[0].id).toBe(1)
    expect(recipients.value[0].campaign_id).toBe(42)
    expect(pagination.value.total).toBe(72)
    expect(pagination.value.lastPage).toBe(5)
    expect(pagination.value.perPage).toBe(15)
  })

  test('fetchRecipients passe les filtres statuses + search', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakeRecipientPaginationMeta, total: 0, last_page: 1 } },
    })

    const { setFilters, fetchRecipients } = useCampaignRecipients(42)
    setFilters({ statuses: ['FAILED', 'DELIVERED'], search: '+33612' })
    await fetchRecipients()

    expect(mockGet).toHaveBeenCalledWith('/campaigns/{campaign}/recipients', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          'filter[status]': 'FAILED,DELIVERED',
          'filter[phone_number]': '+33612',
        }),
      }),
    }))
  })

  test('setPage change la page et re-fetch', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakeRecipientPaginationMeta, current_page: 2 } },
    })

    const { pagination, setPage } = useCampaignRecipients(42)
    await setPage(2)

    expect(pagination.value.page).toBe(2)
    expect(mockGet).toHaveBeenCalledWith('/campaigns/{campaign}/recipients', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({ page: 2 }),
      }),
    }))
  })

  test('setPerPage change le per_page, reset la page et re-fetch', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakeRecipientPaginationMeta, per_page: 25 } },
    })

    const { pagination, setPerPage } = useCampaignRecipients(42)
    pagination.value.page = 3

    await setPerPage(25)

    expect(pagination.value.page).toBe(1)
    expect(pagination.value.perPage).toBe(25)
    expect(mockGet).toHaveBeenCalledWith('/campaigns/{campaign}/recipients', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({ page: 1, per_page: 25 }),
      }),
    }))
  })

  test('setSort toggle desc/asc et re-fetch', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: fakeRecipientPaginationMeta },
    })

    const { sort, setSort } = useCampaignRecipients(42)
    expect(sort.value).toBe('-delivered_at')

    await setSort('delivered_at')
    expect(sort.value).toBe('delivered_at')

    await setSort('delivered_at')
    expect(sort.value).toBe('-delivered_at')

    await setSort('phone_number')
    expect(sort.value).toBe('-phone_number')
  })

  test('fetchRecipients set hasError quand API retourne une erreur', async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { status: 500 } })

    const { hasError, isLoading, fetchRecipients } = useCampaignRecipients(42)
    await fetchRecipients()

    expect(hasError.value).toBe(true)
    expect(isLoading.value).toBe(false)
  })

  test('fetchRecipients reset hasError sur appel suivant reussi', async () => {
    mockGet.mockResolvedValueOnce({ data: undefined, error: { status: 500 } })
    mockGet.mockResolvedValueOnce({
      data: { data: fakeRecipientList(1), meta: fakeRecipientPaginationMeta },
    })

    const { hasError, fetchRecipients } = useCampaignRecipients(42)
    await fetchRecipients()
    expect(hasError.value).toBe(true)

    await fetchRecipients()
    expect(hasError.value).toBe(false)
  })

  test('fetchRecipients gere les exceptions reseau', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))

    const { hasError, fetchRecipients } = useCampaignRecipients(42)
    await fetchRecipients()

    expect(hasError.value).toBe(true)
  })

  test('setFilters remet page a 1', () => {
    const { filters, pagination, setFilters } = useCampaignRecipients(42)
    pagination.value.page = 3

    setFilters({ search: 'foo' })

    expect(filters.value.search).toBe('foo')
    expect(pagination.value.page).toBe(1)
  })

  test('fetchRecipients mappe correctement champs numeriques et nullable', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [{
          ...fakeRecipientList(1)[0],
          short_url_click: '8',
          message_preview_length: '18',
          delivered_at: null,
        }],
        meta: fakeRecipientPaginationMeta,
      },
    })

    const { recipients, fetchRecipients } = useCampaignRecipients(42)
    await fetchRecipients()

    expect(recipients.value[0].short_url_click).toBe(8)
    expect(recipients.value[0].message_preview_length).toBe(18)
    expect(recipients.value[0].delivered_at).toBeNull()
  })
})
