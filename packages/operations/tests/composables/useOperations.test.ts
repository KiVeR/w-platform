import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtApp } from '../helpers/stubs'
import { useOperations } from '#operations/composables/useOperations'

const mockGet = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockNuxtApp({ GET: mockGet })
})

const fakePaginationMeta = {
  current_page: 1,
  last_page: 3,
  total: 42,
}

function fakeOperationList(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    demande_id: 10,
    ref_operation: 'OP-' + (i + 1),
    line_number: i + 1,
    type: 'loc',
    name: 'Operation ' + (i + 1),
    advertiser: null,
    priority: null,
    lifecycle_status: 'draft',
    creative_status: 'not_applicable',
    billing_status: 'not_applicable',
    routing_status: 'not_applicable',
    volume_estimated: 1000,
    volume_sent: null,
    unit_price: null,
    total_price: null,
    assigned_to: null,
    scheduled_at: null,
    delivered_at: null,
    created_at: '2026-03-01T00:00:00Z',
  }))
}

describe('useOperations', () => {
  it('fetchOperations calls GET /operations and maps data + pagination', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeOperationList(3), meta: fakePaginationMeta },
    })

    const { operations, pagination, fetchOperations } = useOperations()
    await fetchOperations()

    expect(mockGet).toHaveBeenCalledWith('/operations', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          sort: '-created_at',
          page: 1,
        }),
      }),
    }))
    expect(operations.value).toHaveLength(3)
    expect(operations.value[0].id).toBe(1)
    expect(operations.value[0].name).toBe('Operation 1')
    expect(pagination.value.total).toBe(42)
    expect(pagination.value.lastPage).toBe(3)
  })

  it('passes filter params when set', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, total: 0, last_page: 1 } },
    })

    const { setFilters, fetchOperations } = useOperations()
    setFilters({ lifecycle_status: 'processing', type: 'fid', search: 'Promo' })
    await fetchOperations()

    expect(mockGet).toHaveBeenCalledWith('/operations', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          'filter[lifecycle_status]': 'processing',
          'filter[type]': 'fid',
          'filter[name]': 'Promo',
        }),
      }),
    }))
  })

  it('sets hasError when API returns error', async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { status: 500 } })

    const { hasError, isLoading, fetchOperations } = useOperations()
    await fetchOperations()

    expect(hasError.value).toBe(true)
    expect(isLoading.value).toBe(false)
  })

  it('resets hasError on successful fetch after error', async () => {
    mockGet.mockResolvedValueOnce({ data: undefined, error: { status: 500 } })
    mockGet.mockResolvedValueOnce({
      data: { data: fakeOperationList(1), meta: fakePaginationMeta },
    })

    const { hasError, fetchOperations } = useOperations()
    await fetchOperations()
    expect(hasError.value).toBe(true)

    await fetchOperations()
    expect(hasError.value).toBe(false)
  })

  it('setPage changes page and re-fetches', async () => {
    mockGet.mockResolvedValue({
      data: { data: [], meta: { ...fakePaginationMeta, current_page: 2 } },
    })

    const { pagination, setPage } = useOperations()
    await setPage(2)

    expect(pagination.value.page).toBe(2)
    expect(mockGet).toHaveBeenCalledWith('/operations', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({ page: 2 }),
      }),
    }))
  })
})
