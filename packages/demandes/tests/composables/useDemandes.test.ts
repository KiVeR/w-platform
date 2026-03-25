import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mockNuxtApp } from '../helpers/stubs'
import { useDemandes } from '../../composables/useDemandes'

function makeRawDemande(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    ref_demande: 'DEM-001',
    ref_client: null,
    information: null,
    is_exoneration: false,
    pays_id: null,
    partner_id: 10,
    commercial_id: null,
    sdr_id: null,
    operations_count: 5,
    operations_completed_count: 3,
    operations_blocked_count: 1,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
    partner: { id: 10, name: 'Acme Corp' },
    ...overrides,
  }
}

function makeApiResponse(data: Record<string, unknown>[], meta: Record<string, unknown> = {}) {
  return {
    data,
    meta: {
      current_page: 1,
      last_page: 1,
      total: data.length,
      ...meta,
    },
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('usePartnerScope', () => ({ withPartnerScope: (p: Record<string, unknown>) => p }))
})

describe('useDemandes', () => {
  it('fetches demandes on call', async () => {
    const apiResponse = makeApiResponse([makeRawDemande()])
    mockNuxtApp({ GET: vi.fn().mockResolvedValue({ data: apiResponse, error: null }) })

    const { demandes, fetchDemandes } = useDemandes()
    await fetchDemandes()

    expect(demandes.value).toHaveLength(1)
    expect(demandes.value[0].ref_demande).toBe('DEM-001')
    expect(demandes.value[0].id).toBe(1)
  })

  it('maps pagination correctly', async () => {
    const apiResponse = makeApiResponse([makeRawDemande()], { current_page: 2, last_page: 5, total: 42 })
    mockNuxtApp({ GET: vi.fn().mockResolvedValue({ data: apiResponse, error: null }) })

    const { pagination, fetchDemandes } = useDemandes()
    await fetchDemandes()

    expect(pagination.value.page).toBe(2)
    expect(pagination.value.lastPage).toBe(5)
    expect(pagination.value.total).toBe(42)
  })

  it('handles API errors gracefully', async () => {
    mockNuxtApp({ GET: vi.fn().mockResolvedValue({ data: null, error: { message: 'Server Error' } }) })

    const { hasError, isLoading, fetchDemandes } = useDemandes()
    await fetchDemandes()

    expect(hasError.value).toBe(true)
    expect(isLoading.value).toBe(false)
  })

  it('sets page and refetches', async () => {
    const GET = vi.fn().mockResolvedValue({ data: makeApiResponse([]), error: null })
    mockNuxtApp({ GET })

    const { setPage } = useDemandes()
    await setPage(3)

    expect(GET).toHaveBeenCalledOnce()
    // verify page param was sent
    const callArgs = GET.mock.calls[0][1]
    expect(callArgs.params.query.page).toBe(3)
  })

  it('toggles sort direction when same field', async () => {
    const GET = vi.fn().mockResolvedValue({ data: makeApiResponse([]), error: null })
    mockNuxtApp({ GET })

    const { sort, setSort } = useDemandes()
    // initial sort is '-created_at'
    expect(sort.value).toBe('-created_at')

    await setSort('created_at')
    // same field as current (desc), should toggle to asc
    expect(sort.value).toBe('created_at')

    await setSort('created_at')
    // now it's asc, toggle back to desc
    expect(sort.value).toBe('-created_at')
  })

  it('sets new field sort to desc when different field', async () => {
    const GET = vi.fn().mockResolvedValue({ data: makeApiResponse([]), error: null })
    mockNuxtApp({ GET })

    const { sort, setSort } = useDemandes()
    await setSort('ref_demande')
    expect(sort.value).toBe('-ref_demande')
  })

  it('resets page on filter change', () => {
    mockNuxtApp({ GET: vi.fn().mockResolvedValue({ data: makeApiResponse([]), error: null }) })

    const { pagination, setFilters } = useDemandes()
    pagination.value.page = 5
    setFilters({ ref_demande: 'DEM' })

    expect(pagination.value.page).toBe(1)
  })

  it('includes partner by default in query', async () => {
    const GET = vi.fn().mockResolvedValue({ data: makeApiResponse([]), error: null })
    mockNuxtApp({ GET })

    const { fetchDemandes } = useDemandes()
    await fetchDemandes()

    const callArgs = GET.mock.calls[0][1]
    expect(callArgs.params.query.include).toBe('partner')
  })

  it('maps operations counts correctly', async () => {
    const rawDemande = makeRawDemande({ operations_count: 10, operations_completed_count: 7, operations_blocked_count: 2 })
    const apiResponse = makeApiResponse([rawDemande])
    mockNuxtApp({ GET: vi.fn().mockResolvedValue({ data: apiResponse, error: null }) })

    const { demandes, fetchDemandes } = useDemandes()
    await fetchDemandes()

    expect(demandes.value[0].operations_count).toBe(10)
    expect(demandes.value[0].operations_completed_count).toBe(7)
    expect(demandes.value[0].operations_blocked_count).toBe(2)
  })

  it('handles empty response', async () => {
    mockNuxtApp({ GET: vi.fn().mockResolvedValue({ data: makeApiResponse([]), error: null }) })

    const { demandes, pagination, fetchDemandes } = useDemandes()
    await fetchDemandes()

    expect(demandes.value).toHaveLength(0)
    expect(pagination.value.total).toBe(0)
  })

  it('applies date range filters', async () => {
    const GET = vi.fn().mockResolvedValue({ data: makeApiResponse([]), error: null })
    mockNuxtApp({ GET })

    const { fetchDemandes, setFilters } = useDemandes()
    setFilters({ created_at_from: '2026-01-01', created_at_to: '2026-12-31' })
    await fetchDemandes()

    const query = GET.mock.calls[0][1].params.query
    expect(query['filter[created_at_from]']).toBe('2026-01-01')
    expect(query['filter[created_at_to]']).toBe('2026-12-31')
  })

  it('applies ref_demande partial filter', async () => {
    const GET = vi.fn().mockResolvedValue({ data: makeApiResponse([]), error: null })
    mockNuxtApp({ GET })

    const { fetchDemandes, setFilters } = useDemandes()
    setFilters({ ref_demande: 'DEM-00' })
    await fetchDemandes()

    const query = GET.mock.calls[0][1].params.query
    expect(query['filter[ref_demande]']).toBe('DEM-00')
  })
})
