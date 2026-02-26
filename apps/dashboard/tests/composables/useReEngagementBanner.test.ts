import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref } from 'vue'
import { mockUseI18n } from '../helpers/stubs'
import { stubAuthGlobals } from '../helpers/auth-stubs'

const mockGet = vi.fn()
stubAuthGlobals({ $api: { GET: mockGet, POST: vi.fn(), PUT: vi.fn(), DELETE: vi.fn() } })
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
mockUseI18n()

vi.mock('@/stores/partner', () => ({
  usePartnerStore: () => ({
    effectivePartnerId: 7,
  }),
}))

const sessionStore: Record<string, string> = {}
const sessionStorageMock = {
  getItem: (key: string) => sessionStore[key] ?? null,
  setItem: (key: string, value: string) => { sessionStore[key] = value },
  removeItem: (key: string) => { delete sessionStore[key] },
  clear: () => { Object.keys(sessionStore).forEach(k => delete sessionStore[k]) },
}
vi.stubGlobal('sessionStorage', sessionStorageMock)

const { useReEngagementBanner } = await import('@/composables/useReEngagementBanner')

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

describe('useReEngagementBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorageMock.clear()
  })

  it('fetch calls API with correct params', async () => {
    mockGet.mockResolvedValue({
      data: { data: [] },
      error: null,
    })

    const { fetch } = useReEngagementBanner()
    await fetch()

    expect(mockGet).toHaveBeenCalledWith('/campaigns', {
      params: {
        query: expect.objectContaining({
          'filter[status]': 'sent',
          'sort': '-sent_at',
          'per_page': 1,
        }),
      },
    })
  })

  it('sets lastCampaign from API response', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [{
          id: 42,
          name: 'Promo été',
          volume_estimated: 12000,
          sent_at: daysAgo(30),
        }],
      },
      error: null,
    })

    const { fetch, lastCampaign } = useReEngagementBanner()
    await fetch()

    expect(lastCampaign.value).not.toBeNull()
    expect(lastCampaign.value!.id).toBe(42)
    expect(lastCampaign.value!.name).toBe('Promo été')
    expect(lastCampaign.value!.volume).toBe(12000)
  })

  it('shouldShow is true when daysSinceLastSend is between 25 and 35', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [{
          id: 1,
          name: 'Test',
          volume_estimated: 500,
          sent_at: daysAgo(30),
        }],
      },
      error: null,
    })

    const { fetch, shouldShow, daysSinceLastSend } = useReEngagementBanner()
    await fetch()

    expect(daysSinceLastSend.value).toBe(30)
    expect(shouldShow.value).toBe(true)
  })

  it('shouldShow is true at boundary 25 days', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [{
          id: 1,
          name: 'Test',
          volume_estimated: 100,
          sent_at: daysAgo(25),
        }],
      },
      error: null,
    })

    const { fetch, shouldShow } = useReEngagementBanner()
    await fetch()
    expect(shouldShow.value).toBe(true)
  })

  it('shouldShow is false when daysSinceLastSend < 25', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [{
          id: 1,
          name: 'Recent',
          volume_estimated: 300,
          sent_at: daysAgo(10),
        }],
      },
      error: null,
    })

    const { fetch, shouldShow } = useReEngagementBanner()
    await fetch()
    expect(shouldShow.value).toBe(false)
  })

  it('shouldShow is false when daysSinceLastSend > 35', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [{
          id: 1,
          name: 'Old',
          volume_estimated: 200,
          sent_at: daysAgo(40),
        }],
      },
      error: null,
    })

    const { fetch, shouldShow } = useReEngagementBanner()
    await fetch()
    expect(shouldShow.value).toBe(false)
  })

  it('dismiss sets isDismissed and persists to sessionStorage', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [{
          id: 1,
          name: 'Test',
          volume_estimated: 500,
          sent_at: daysAgo(30),
        }],
      },
      error: null,
    })

    const { fetch, shouldShow, isDismissed, dismiss } = useReEngagementBanner()
    await fetch()
    expect(shouldShow.value).toBe(true)

    dismiss()
    expect(isDismissed.value).toBe(true)
    expect(shouldShow.value).toBe(false)
    expect(sessionStorageMock.getItem('re-engagement-dismissed-7')).toBe('true')
  })

  it('reads dismissed state from sessionStorage on init', () => {
    sessionStorageMock.setItem('re-engagement-dismissed-7', 'true')

    const { isDismissed } = useReEngagementBanner()
    expect(isDismissed.value).toBe(true)
  })

  it('shouldShow is false when no campaigns returned', async () => {
    mockGet.mockResolvedValue({
      data: { data: [] },
      error: null,
    })

    const { fetch, shouldShow } = useReEngagementBanner()
    await fetch()
    expect(shouldShow.value).toBe(false)
  })
})
