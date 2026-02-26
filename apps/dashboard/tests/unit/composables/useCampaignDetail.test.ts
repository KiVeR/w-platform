import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeCampaign } from '../../helpers/fixtures'

const mockGet = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet } })
  setActivePinia(createPinia())
})

const { useCampaignDetail } = await import('@/composables/useCampaignDetail')

describe('useCampaignDetail', () => {
  test('fetchCampaign appelle GET /campaigns/{campaign} et mappe la réponse', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeCampaign },
      error: null,
    })

    const { campaign, fetchCampaign, isLoading } = useCampaignDetail(1)
    await fetchCampaign()

    expect(mockGet).toHaveBeenCalledWith('/campaigns/{campaign}', expect.objectContaining({
      params: expect.objectContaining({
        path: { campaign: 1 },
      }),
    }))
    expect(campaign.value).not.toBeNull()
    expect(campaign.value!.id).toBe(1)
    expect(campaign.value!.name).toBe('Promo ete 2026')
    expect(campaign.value!.type).toBe('prospection')
    expect(campaign.value!.status).toBe('sent')
    expect(isLoading.value).toBe(false)
  })

  test('fetchCampaign set error quand API retourne une erreur', async () => {
    mockGet.mockResolvedValue({ data: null, error: { status: 404 } })

    const { error, isLoading, fetchCampaign } = useCampaignDetail(1)
    await fetchCampaign()

    expect(error.value).toBe('load_error')
    expect(isLoading.value).toBe(false)
  })

  test('fetchCampaign gère les exceptions réseau', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))

    const { error, fetchCampaign } = useCampaignDetail(1)
    await fetchCampaign()

    expect(error.value).toBe('load_error')
  })

  test('exportCampaign appelle GET /campaigns/{campaign}/export avec parseAs blob', async () => {
    const blob = new Blob(['csv,data'], { type: 'text/csv' })
    mockGet.mockResolvedValue({ data: blob, error: null })

    // Mock DOM methods for download
    const createElementSpy = vi.spyOn(document, 'createElement')
    const mockAnchor = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement
    createElementSpy.mockReturnValue(mockAnchor)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const { exportCampaign, isExporting } = useCampaignDetail(42)
    await exportCampaign()

    expect(mockGet).toHaveBeenCalledWith('/campaigns/{campaign}/export', expect.objectContaining({
      params: expect.objectContaining({
        path: { campaign: 42 },
      }),
      parseAs: 'blob',
    }))
    expect(mockAnchor.download).toBe('campagne-42-export.csv')
    expect((mockAnchor as { click: () => void }).click).toHaveBeenCalled()
    expect(isExporting.value).toBe(false)

    createElementSpy.mockRestore()
  })

  test('exportCampaign ne télécharge pas quand API retourne une erreur', async () => {
    mockGet.mockResolvedValue({ data: null, error: { status: 422 } })

    const createElementSpy = vi.spyOn(document, 'createElement')

    const { exportCampaign } = useCampaignDetail(1)
    await exportCampaign()

    // createElement should not have been called for 'a' tag
    expect(createElementSpy).not.toHaveBeenCalledWith('a')

    createElementSpy.mockRestore()
  })
})
