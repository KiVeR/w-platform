import { describe, it, expect, vi, beforeEach } from 'vitest'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'

const mockGet = vi.fn()
stubAuthGlobals({ $api: { GET: mockGet, POST: vi.fn(), PUT: vi.fn() } })

const { usePartnerShops } = await import('@/composables/usePartnerShops')

describe('usePartnerShops', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it('fetchShops returns shops and primaryShop is the first', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          { id: 1, name: 'Shop 1', address: '12 rue de Lyon', city: 'Lyon', zip_code: '69007', latitude: '45.75', longitude: '4.85' },
          { id: 2, name: 'Shop 2', address: '5 rue de Paris', city: 'Paris', zip_code: '75001', latitude: '48.86', longitude: '2.34' },
        ],
      },
      error: null,
    })

    const { shops, primaryShop, fetchShops } = usePartnerShops()
    await fetchShops(42)

    expect(shops.value).toHaveLength(2)
    expect(primaryShop.value).not.toBeNull()
    expect(primaryShop.value!.name).toBe('Shop 1')
    expect(primaryShop.value!.latitude).toBe(45.75)
    expect(primaryShop.value!.longitude).toBe(4.85)
  })

  it('primaryShop is null when no shops', async () => {
    mockGet.mockResolvedValue({
      data: { data: [] },
      error: null,
    })

    const { primaryShop, fetchShops } = usePartnerShops()
    await fetchShops(42)

    expect(primaryShop.value).toBeNull()
  })

  it('isLoading toggles during fetch', async () => {
    let resolvePromise!: (value: unknown) => void
    mockGet.mockReturnValue(new Promise(r => { resolvePromise = r }))

    const { isLoading, fetchShops } = usePartnerShops()
    expect(isLoading.value).toBe(false)

    const promise = fetchShops(42)
    expect(isLoading.value).toBe(true)

    resolvePromise({ data: { data: [] }, error: null })
    await promise

    expect(isLoading.value).toBe(false)
  })

  it('handles API error gracefully', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))

    const { shops, primaryShop, fetchShops } = usePartnerShops()
    await fetchShops(42)

    expect(shops.value).toHaveLength(0)
    expect(primaryShop.value).toBeNull()
  })
})
