import { describe, it, expect, beforeEach, vi } from 'vitest'
import { stubAuthGlobals } from '../../helpers/auth-stubs'

const mockApi = { GET: vi.fn(), POST: vi.fn() }
stubAuthGlobals({ $api: mockApi })

const { useHubDashboard } = await import('@/composables/useHubDashboard')

function fakePartnerRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Partner A',
    is_active: true,
    euro_credits: '500.00',
    ...overrides,
  }
}

function mockPartnersResponse(partners: Record<string, unknown>[]) {
  return {
    data: { data: partners, meta: { total: partners.length } },
    error: undefined,
  }
}

function mockDemandesResponse(total: number) {
  return {
    data: { data: [], meta: { total } },
    error: undefined,
  }
}

describe('useHubDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('computes KPIs from partners and demandes', async () => {
    const partners = [
      fakePartnerRow({ id: 1, name: 'A', euro_credits: '300.50', is_active: true }),
      fakePartnerRow({ id: 2, name: 'B', euro_credits: '150.00', is_active: true }),
      fakePartnerRow({ id: 3, name: 'C', euro_credits: '50.00', is_active: false }),
    ]

    mockApi.GET
      .mockResolvedValueOnce(mockPartnersResponse(partners))
      .mockResolvedValueOnce(mockDemandesResponse(7))

    const { stats, alerts, isLoading, fetchDashboard } = useHubDashboard()

    expect(isLoading.value).toBe(false)

    await fetchDashboard()

    expect(isLoading.value).toBe(false)
    expect(stats.value).not.toBeNull()
    expect(stats.value!.partnersCount).toBe(3)
    expect(stats.value!.activePartnersCount).toBe(2)
    expect(stats.value!.totalCredits).toBeCloseTo(500.50)
    expect(stats.value!.totalDemandes).toBe(7)
  })

  it('detects low-credits alerts (< 200 EUR)', async () => {
    const partners = [
      fakePartnerRow({ id: 1, name: 'Rich', euro_credits: '500.00' }),
      fakePartnerRow({ id: 2, name: 'Low', euro_credits: '99.50' }),
      fakePartnerRow({ id: 3, name: 'Exact', euro_credits: '200.00' }),
      fakePartnerRow({ id: 4, name: 'Zero', euro_credits: '0.00' }),
    ]

    mockApi.GET
      .mockResolvedValueOnce(mockPartnersResponse(partners))
      .mockResolvedValueOnce(mockDemandesResponse(0))

    const { alerts, fetchDashboard } = useHubDashboard()

    await fetchDashboard()

    expect(alerts.value).toHaveLength(2)
    expect(alerts.value[0].partnerId).toBe(2)
    expect(alerts.value[0].partnerName).toBe('Low')
    expect(alerts.value[0].type).toBe('low-credits')
    expect(alerts.value[0].message).toBe('99.50 EUR')
    expect(alerts.value[1].partnerId).toBe(4)
    expect(alerts.value[1].partnerName).toBe('Zero')
  })

  it('returns empty alerts when all partners have enough credits', async () => {
    const partners = [
      fakePartnerRow({ id: 1, euro_credits: '1000.00' }),
      fakePartnerRow({ id: 2, euro_credits: '250.00' }),
    ]

    mockApi.GET
      .mockResolvedValueOnce(mockPartnersResponse(partners))
      .mockResolvedValueOnce(mockDemandesResponse(0))

    const { alerts, fetchDashboard } = useHubDashboard()

    await fetchDashboard()

    expect(alerts.value).toHaveLength(0)
  })

  it('sets isLoading during fetch', async () => {
    let resolvePartners: (v: unknown) => void = () => {}
    const partnersPromise = new Promise(resolve => { resolvePartners = resolve })

    mockApi.GET
      .mockReturnValueOnce(partnersPromise)
      .mockResolvedValueOnce(mockDemandesResponse(0))

    const { isLoading, fetchDashboard } = useHubDashboard()

    const promise = fetchDashboard()
    expect(isLoading.value).toBe(true)

    resolvePartners(mockPartnersResponse([fakePartnerRow()]))
    await promise

    expect(isLoading.value).toBe(false)
  })

  it('handles API error gracefully', async () => {
    mockApi.GET
      .mockResolvedValueOnce({ data: undefined, error: { status: 500 } })
      .mockResolvedValueOnce(mockDemandesResponse(0))

    const { stats, alerts, hasError, fetchDashboard } = useHubDashboard()

    await fetchDashboard()

    expect(hasError.value).toBe(true)
    expect(stats.value).toBeNull()
    expect(alerts.value).toHaveLength(0)
  })

  it('parses euro_credits as float from string', async () => {
    const partners = [
      fakePartnerRow({ id: 1, euro_credits: '123.456' }),
    ]

    mockApi.GET
      .mockResolvedValueOnce(mockPartnersResponse(partners))
      .mockResolvedValueOnce(mockDemandesResponse(0))

    const { stats, fetchDashboard } = useHubDashboard()

    await fetchDashboard()

    expect(stats.value!.totalCredits).toBeCloseTo(123.456)
  })

  it('handles demandes API error gracefully (totalDemandes = 0)', async () => {
    mockApi.GET
      .mockResolvedValueOnce(mockPartnersResponse([fakePartnerRow()]))
      .mockResolvedValueOnce({ data: undefined, error: { status: 500 } })

    const { stats, fetchDashboard } = useHubDashboard()

    await fetchDashboard()

    expect(stats.value!.totalDemandes).toBe(0)
  })

  it('calls GET /partners and GET /demandes with correct params', async () => {
    mockApi.GET
      .mockResolvedValueOnce(mockPartnersResponse([]))
      .mockResolvedValueOnce(mockDemandesResponse(0))

    const { fetchDashboard } = useHubDashboard()

    await fetchDashboard()

    expect(mockApi.GET).toHaveBeenCalledWith('/partners', {
      params: { query: { per_page: 100 } },
    })
    expect(mockApi.GET).toHaveBeenCalledWith('/demandes', {
      params: { query: { per_page: 1 } },
    })
  })
})
