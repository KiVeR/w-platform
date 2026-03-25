import { beforeEach, describe, expect, test, vi } from 'vitest'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'

const mockGet = vi.fn()
const mockPut = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet, PUT: mockPut } })
})

const { usePartnerFeatures } = await import('@/composables/usePartnerFeatures')

describe('usePartnerFeatures', () => {
  test('fetchFeatures loads features list', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          { key: 'shops', is_enabled: true },
          { key: 'payment', is_enabled: false },
          { key: 'campaign_prospection', is_enabled: true },
        ],
      },
      error: undefined,
    })

    const { features, fetchFeatures, isLoading, hasError } = usePartnerFeatures()
    await fetchFeatures(42)

    expect(isLoading.value).toBe(false)
    expect(hasError.value).toBe(false)
    expect(features.value).toHaveLength(3)
    expect(features.value[0].key).toBe('shops')
    expect(features.value[0].is_enabled).toBe(true)
    expect(features.value[1].is_enabled).toBe(false)
  })

  test('fetchFeatures sets hasError on failure', async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { status: 500 } })

    const { hasError, fetchFeatures } = usePartnerFeatures()
    await fetchFeatures(42)

    expect(hasError.value).toBe(true)
  })

  test('toggleFeature calls PUT and updates local state', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          { key: 'shops', is_enabled: false },
        ],
      },
      error: undefined,
    })
    mockPut.mockResolvedValue({ data: { data: { key: 'shops', is_enabled: true } }, error: undefined })

    const { features, fetchFeatures, toggleFeature } = usePartnerFeatures()
    await fetchFeatures(42)

    expect(features.value[0].is_enabled).toBe(false)

    const result = await toggleFeature(42, 'shops', true)

    expect(result).toBe(true)
    expect(features.value[0].is_enabled).toBe(true)
  })

  test('toggleFeature returns false on error without changing local state', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          { key: 'shops', is_enabled: false },
        ],
      },
      error: undefined,
    })
    mockPut.mockResolvedValue({ data: undefined, error: { status: 403 } })

    const { features, fetchFeatures, toggleFeature } = usePartnerFeatures()
    await fetchFeatures(42)

    const result = await toggleFeature(42, 'shops', true)

    expect(result).toBe(false)
    expect(features.value[0].is_enabled).toBe(false)
  })
})
