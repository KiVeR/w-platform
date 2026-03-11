import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeCampaignList, fakePaginationMeta, fakeUser } from '../../helpers/fixtures'
import { useDashboardStats } from '@/composables/useDashboardStats'
import { useAuthStore } from '@/stores/auth'

const mockGet = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-11T10:00:00Z'))
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet } })
  setActivePinia(createPinia())

  const auth = useAuthStore()
  auth.user = { ...fakeUser }
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDashboardStats', () => {
  test('fetchStats charge les pages utiles et derive les KPIs de la periode', async () => {
    mockGet
      .mockResolvedValueOnce({
        data: {
          data: [
            { ...fakeCampaignList(1)[0], status: 'sent', volume_estimated: '1000', created_at: '2026-03-10T09:00:00Z' },
            { ...fakeCampaignList(1)[0], id: '2', status: 'sending', volume_estimated: '1200', created_at: '2026-03-09T09:00:00Z' },
            { ...fakeCampaignList(1)[0], id: '3', status: 'scheduled', volume_estimated: '800', created_at: '2026-03-08T09:00:00Z' },
          ],
          meta: { ...fakePaginationMeta, current_page: 1, last_page: 2 },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            { ...fakeCampaignList(1)[0], id: '4', status: 'failed', volume_estimated: '600', created_at: '2026-03-06T09:00:00Z' },
            { ...fakeCampaignList(1)[0], id: '5', status: 'draft', volume_estimated: '400', created_at: '2026-03-03T09:00:00Z' },
          ],
          meta: { ...fakePaginationMeta, current_page: 2, last_page: 2 },
        },
        error: null,
      })

    const { stats, volumeData, activityData, fetchStats } = useDashboardStats()
    await fetchStats()

    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(mockGet).toHaveBeenCalledWith('/campaigns', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          sort: '-created_at',
          page: 1,
          'filter[partner_id]': 42,
        }),
      }),
    }))
    expect(mockGet).toHaveBeenCalledWith('/campaigns', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({ page: 2 }),
      }),
    }))

    expect(stats.value).toEqual({
      activeCount: 2,
      scheduledCount: 1,
      errorCount: 1,
      totalVolume: 4000,
    })
    expect(volumeData.value?.labels).toHaveLength(30)
    expect(volumeData.value?.values.reduce((total, value) => total + value, 0)).toBe(4000)
    expect(activityData.value?.values.reduce((total, value) => total + value, 0)).toBe(5)
  })

  test('fetchRecentCampaigns garde uniquement les 5 premieres campagnes', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: fakeCampaignList(6),
        meta: { ...fakePaginationMeta, current_page: 1, last_page: 1 },
      },
      error: null,
    })

    const { recentCampaigns, fetchRecentCampaigns } = useDashboardStats()
    await fetchRecentCampaigns()

    expect(recentCampaigns.value).toHaveLength(5)
    expect(recentCampaigns.value[0].id).toBe(1)
    expect(recentCampaigns.value.at(-1)?.id).toBe(5)
  })

  test('setPeriod change la periode et relance le fetch', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [],
        meta: { ...fakePaginationMeta, current_page: 1, last_page: 1, total: 0 },
      },
      error: null,
    })

    const { period, setPeriod } = useDashboardStats()

    await setPeriod('7d')
    expect(period.value).toBe('7d')
    expect(mockGet).toHaveBeenCalledTimes(1)

    await setPeriod('7d')
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  test('remonte hasError si le fetch echoue', async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { status: 500 } })

    const { hasError, stats, fetchStats } = useDashboardStats()
    await fetchStats()

    expect(hasError.value).toBe(true)
    expect(stats.value).toBeNull()
  })
})
