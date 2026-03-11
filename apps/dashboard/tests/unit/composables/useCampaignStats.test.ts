import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { useCampaignStats } from '@/composables/useCampaignStats'

const mockGet = vi.fn()

const fakeStats = {
  sent: 12000,
  delivered: 11500,
  undeliverable: 300,
  rejected: 100,
  expired: 100,
  stop: 50,
  clicks: 1200,
  deliverability_rate: 0.958,
  ctr: 0.104,
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet } })
  setActivePinia(createPinia())
})

describe('useCampaignStats', () => {
  test('fetchStats mappe les stats', async () => {
    mockGet.mockResolvedValue({ data: { data: fakeStats }, error: null })

    const { stats, fetchStats, errorType } = useCampaignStats(42)
    await fetchStats()

    expect(mockGet).toHaveBeenCalledWith('/campaigns/{campaign}/stats', {
      params: { path: { campaign: 42 } },
    })
    expect(stats.value).toEqual(fakeStats)
    expect(errorType.value).toBeNull()
  })

  test('fetchStats gere le not_yet', async () => {
    mockGet.mockResolvedValue({
      data: null,
      error: { message: 'Stats not yet available.', available_at: '2026-02-08T09:02:00Z' },
      response: { status: 422 },
    })

    const { fetchStats, errorType, availableAt } = useCampaignStats(42)
    await fetchStats()

    expect(errorType.value).toBe('not_yet')
    expect(availableAt.value).toBe('2026-02-08T09:02:00Z')
  })

  test('fetchStats gere le only_sent', async () => {
    mockGet.mockResolvedValue({
      data: null,
      error: { message: 'Stats only available for sent campaigns.' },
      response: { status: 422 },
    })

    const { fetchStats, errorType } = useCampaignStats(42)
    await fetchStats()

    expect(errorType.value).toBe('only_sent')
  })

  test('fetchStats gere les erreurs provider', async () => {
    mockGet.mockResolvedValue({
      data: null,
      error: { message: 'Stats retrieval failed.' },
      response: { status: 503 },
    })

    const { fetchStats, errorType } = useCampaignStats(42)
    await fetchStats()

    expect(errorType.value).toBe('provider')
  })
})
