import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { localStorageMock, stubAuthGlobals } from '../helpers/auth-stubs'

const mockGet = vi.fn()
stubAuthGlobals({ $api: { GET: mockGet, POST: vi.fn(), PUT: vi.fn() } })
vi.stubGlobal('computed', (await import('vue')).computed)
vi.stubGlobal('ref', (await import('vue')).ref)

const mockShops = ref<any[]>([])
const mockFetchShops = vi.fn()

vi.mock('@/composables/usePartnerShops', () => ({
  usePartnerShops: () => ({
    shops: mockShops,
    primaryShop: ref(null),
    isLoading: ref(false),
    fetchShops: mockFetchShops,
  }),
}))

vi.mock('@/stores/partner', () => ({
  usePartnerStore: () => ({
    effectivePartnerId: 42,
  }),
}))

const { useExpertMode } = await import('@/composables/useExpertMode')

describe('useExpertMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockShops.value = []
  })

  it('defaults to smart mode', () => {
    const { effectiveMode } = useExpertMode()
    expect(effectiveMode.value).toBe('smart')
  })

  it('returns classic when campaign count > 20', async () => {
    mockGet.mockResolvedValue({
      data: { meta: { total: 25 } },
      error: null,
    })

    const { detect, effectiveMode } = useExpertMode()
    await detect()
    expect(effectiveMode.value).toBe('classic')
  })

  it('returns classic when shop count > 5', async () => {
    mockGet.mockResolvedValue({
      data: { meta: { total: 5 } },
      error: null,
    })
    mockShops.value = Array.from({ length: 6 }, (_, i) => ({ id: i }))

    const { detect, effectiveMode } = useExpertMode()
    await detect()
    expect(effectiveMode.value).toBe('classic')
  })

  it('returns smart when campaign count <= 20 and shop count <= 5', async () => {
    mockGet.mockResolvedValue({
      data: { meta: { total: 10 } },
      error: null,
    })
    mockShops.value = [{ id: 1 }]

    const { detect, effectiveMode } = useExpertMode()
    await detect()
    expect(effectiveMode.value).toBe('smart')
  })

  it('respects localStorage override to classic', () => {
    localStorageMock.setItem('wellpack-targeting-mode', 'classic')
    const { effectiveMode } = useExpertMode()
    expect(effectiveMode.value).toBe('classic')
  })

  it('respects localStorage override to smart', async () => {
    localStorageMock.setItem('wellpack-targeting-mode', 'smart')
    mockGet.mockResolvedValue({
      data: { meta: { total: 50 } },
      error: null,
    })

    const { detect, effectiveMode } = useExpertMode()
    await detect()
    // localStorage override wins even though campaigns > 20
    expect(effectiveMode.value).toBe('smart')
  })

  it('setMode persists to localStorage', () => {
    const { setMode, effectiveMode } = useExpertMode()
    setMode('classic')
    expect(localStorageMock.getItem('wellpack-targeting-mode')).toBe('classic')
    expect(effectiveMode.value).toBe('classic')
  })

  it('setMode switches from classic to smart', () => {
    const { setMode, effectiveMode } = useExpertMode()
    setMode('classic')
    expect(effectiveMode.value).toBe('classic')
    setMode('smart')
    expect(effectiveMode.value).toBe('smart')
  })

  it('defaults to smart when API fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))

    const { detect, effectiveMode } = useExpertMode()
    await detect()
    expect(effectiveMode.value).toBe('smart')
  })

  it('isExpert is false by default', () => {
    const { isExpert } = useExpertMode()
    expect(isExpert.value).toBe(false)
  })

  it('detect calls campaigns API and fetchShops', async () => {
    mockGet.mockResolvedValue({
      data: { meta: { total: 5 } },
      error: null,
    })

    const { detect } = useExpertMode()
    await detect()
    expect(mockGet).toHaveBeenCalledWith('/campaigns', expect.anything())
    expect(mockFetchShops).toHaveBeenCalledWith(42)
  })
})
