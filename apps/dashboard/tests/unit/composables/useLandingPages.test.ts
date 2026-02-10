import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { localStorageMock, stubAuthGlobals } from '../../helpers/auth-stubs'
import { fakeLandingPageList } from '../../helpers/fixtures'

const mockGet = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  stubAuthGlobals({ $api: { GET: mockGet } })
  setActivePinia(createPinia())
})

const { useLandingPages } = await import('@/composables/useLandingPages')

describe('useLandingPages', () => {
  it('fetchLandingPages calls GET /landing-pages with partner scope and status filter', async () => {
    mockGet.mockResolvedValue({
      data: { data: fakeLandingPageList(2) },
    })

    const { fetchLandingPages } = useLandingPages()
    await fetchLandingPages()

    expect(mockGet).toHaveBeenCalledWith('/landing-pages', expect.objectContaining({
      params: expect.objectContaining({
        query: expect.objectContaining({
          'filter[status]': 'published',
        }),
      }),
    }))
  })

  it('maps raw response to typed LandingPageRow[]', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: [
          { id: '5', name: 'Test LP', status: 'published', is_active: 'true', created_at: '2026-01-01T00:00:00Z' },
        ],
      },
    })

    const { landingPages, fetchLandingPages } = useLandingPages()
    await fetchLandingPages()

    expect(landingPages.value).toHaveLength(1)
    expect(landingPages.value[0].id).toBe(5)
    expect(typeof landingPages.value[0].id).toBe('number')
    expect(landingPages.value[0].status).toBe('published')
  })

  it('sets hasError on API error', async () => {
    mockGet.mockResolvedValue({ data: undefined, error: { status: 500 } })

    const { hasError, isLoading, fetchLandingPages } = useLandingPages()
    await fetchLandingPages()

    expect(hasError.value).toBe(true)
    expect(isLoading.value).toBe(false)
  })

  it('resets hasError on subsequent success', async () => {
    mockGet.mockResolvedValueOnce({ data: undefined, error: { status: 500 } })
    mockGet.mockResolvedValueOnce({
      data: { data: fakeLandingPageList(1) },
    })

    const { hasError, fetchLandingPages } = useLandingPages()

    await fetchLandingPages()
    expect(hasError.value).toBe(true)

    await fetchLandingPages()
    expect(hasError.value).toBe(false)
  })
})
