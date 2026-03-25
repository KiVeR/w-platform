import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakePartnerList, fakePartnerPaginationMeta } from '../../helpers/fixtures'
import { usePartners } from '@/composables/usePartners'

const mockGet = vi.fn()
const mockDelete = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet, DELETE: mockDelete } })
  setActivePinia(createPinia())
})

describe('usePartners', () => {
  test('fetchPartners calls GET /partners and maps data + pagination', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakePartnerList(3), meta: fakePartnerPaginationMeta },
    })

    const { partners, pagination, fetchPartners } = usePartners()
    await fetchPartners()

    expect(mockGet).toHaveBeenCalledWith('/partners', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          sort: '-created_at',
          page: 1,
          per_page: 15,
        }),
      }),
    }))
    expect(partners.value).toHaveLength(3)
    expect(partners.value[0].id).toBe(1)
    expect(partners.value[0].name).toBe('Partner 1')
    expect(partners.value[0].euro_credits).toBe(500) // parsed from string '500'
    expect(partners.value[0].users_count).toBe(1)
    expect(partners.value[0].shops_count).toBe(2)
    expect(pagination.value.total).toBe(25)
    expect(pagination.value.lastPage).toBe(2)
  })

  test('fetchPartners parses euro_credits as float from string', async () => {
    const partnerRow = {
      ...fakePartnerList(1)[0],
      euro_credits: '1234.56',
    }
    mockGet.mockResolvedValue({
      data: { data: [partnerRow], meta: fakePartnerPaginationMeta },
    })

    const { partners, fetchPartners } = usePartners()
    await fetchPartners()

    expect(partners.value[0].euro_credits).toBeCloseTo(1234.56)
  })

  test('fetchPartners passes name filter', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePartnerPaginationMeta, total: 0, last_page: 1 } },
    })

    const { setFilters, fetchPartners } = usePartners()
    setFilters({ name: 'Dupont' })
    await fetchPartners()

    expect(mockGet).toHaveBeenCalledWith('/partners', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          'filter[name]': 'Dupont',
        }),
      }),
    }))
  })

  test('fetchPartners passes is_active filter', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePartnerPaginationMeta, total: 0, last_page: 1 } },
    })

    const { setFilters, fetchPartners } = usePartners()
    setFilters({ is_active: true })
    await fetchPartners()

    expect(mockGet).toHaveBeenCalledWith('/partners', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          'filter[is_active]': 1,
        }),
      }),
    }))
  })

  test('fetchPartners does not include is_active filter when null', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePartnerPaginationMeta, total: 0, last_page: 1 } },
    })

    const { setFilters, fetchPartners } = usePartners()
    setFilters({ is_active: null })
    await fetchPartners()

    const callArgs = mockGet.mock.calls[0][1]
    expect(callArgs.params.query).not.toHaveProperty('filter[is_active]')
  })

  test('setPage changes the page and re-fetches', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePartnerPaginationMeta, current_page: 2 } },
    })

    const { pagination, setPage } = usePartners()
    await setPage(2)

    expect(pagination.value.page).toBe(2)
    expect(mockGet).toHaveBeenCalledWith('/partners', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({ page: 2 }),
      }),
    }))
  })

  test('setSort toggles desc/asc and re-fetches', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: fakePartnerPaginationMeta },
    })

    const { sort, setSort } = usePartners()
    expect(sort.value).toBe('-created_at')

    await setSort('created_at')
    expect(sort.value).toBe('created_at')

    await setSort('created_at')
    expect(sort.value).toBe('-created_at')

    await setSort('name')
    expect(sort.value).toBe('-name')
  })

  test('fetchPartners sets hasError when API returns an error', async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { status: 500 } })

    const { hasError, isLoading, fetchPartners } = usePartners()
    await fetchPartners()

    expect(hasError.value).toBe(true)
    expect(isLoading.value).toBe(false)
  })

  test('fetchPartners resets hasError on successful subsequent call', async () => {
    mockGet.mockResolvedValueOnce({ data: undefined, error: { status: 500 } })
    mockGet.mockResolvedValueOnce({
      data: { data: fakePartnerList(1), meta: fakePartnerPaginationMeta },
    })

    const { hasError, fetchPartners } = usePartners()

    await fetchPartners()
    expect(hasError.value).toBe(true)

    await fetchPartners()
    expect(hasError.value).toBe(false)
  })

  test('deletePartner calls DELETE and returns true on success', async () => {
    mockDelete.mockResolvedValue({ data: {}, error: undefined })

    const { deletePartner } = usePartners()
    const result = await deletePartner(1)

    expect(mockDelete).toHaveBeenCalledWith('/partners/{partner}', {
      params: { path: { partner: 1 } },
    })
    expect(result).toBe(true)
  })

  test('deletePartner returns false on error', async () => {
    mockDelete.mockResolvedValue({ data: undefined, error: { status: 403 } })

    const { deletePartner } = usePartners()
    const result = await deletePartner(999)

    expect(result).toBe(false)
  })

  test('setFilters resets page to 1', () => {
    const { filters, pagination, setFilters } = usePartners()
    pagination.value.page = 3
    setFilters({ name: 'Test' })

    expect(filters.value.name).toBe('Test')
    expect(pagination.value.page).toBe(1)
  })

  test('maps null fields correctly', async () => {
    const partnerRow = {
      id: '1',
      name: 'No Details',
      code: null,
      activity_type: null,
      email: null,
      euro_credits: '0.00',
      is_active: false,
      users_count: '0',
      shops_count: '0',
      created_at: '2026-01-01T00:00:00Z',
    }
    mockGet.mockResolvedValue({
      data: { data: [partnerRow], meta: fakePartnerPaginationMeta },
    })

    const { partners, fetchPartners } = usePartners()
    await fetchPartners()

    expect(partners.value[0].code).toBeNull()
    expect(partners.value[0].activity_type).toBeNull()
    expect(partners.value[0].email).toBeNull()
    expect(partners.value[0].is_active).toBe(false)
    expect(partners.value[0].euro_credits).toBe(0)
  })
})
