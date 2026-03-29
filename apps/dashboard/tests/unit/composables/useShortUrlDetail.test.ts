import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { stubAuthGlobals } from '../../helpers/auth-stubs'

const mockGet = vi.fn()
const mockPut = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    GET: mockGet,
    PUT: mockPut,
    DELETE: mockDelete,
  }),
}))

const shortUrlFixture = {
  id: 1,
  slug: 'abc123',
  link: 'https://example.com',
  click_count: 42,
  click_count_bots: 3,
  is_draft: false,
  is_enabled: true,
  is_traceable_by_recipient: true,
  import_id: null,
}

describe('useShortUrlDetail', () => {
  beforeEach(() => {
    stubAuthGlobals()
    vi.clearAllMocks()
  })

  it('fetchShortUrl calls GET and maps result into shortUrl ref', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: shortUrlFixture }, error: null })

    const { useShortUrlDetail } = await import('@/composables/useShortUrlDetail')
    const id = ref<number | null>(1)
    const { shortUrl, isLoading, hasError, fetchShortUrl } = useShortUrlDetail(id)

    await fetchShortUrl()

    expect(mockGet).toHaveBeenCalledWith('/short-urls/{shortUrlIdOrSlug}', expect.anything())
    expect(shortUrl.value).not.toBeNull()
    expect(shortUrl.value?.id).toBe(1)
    expect(shortUrl.value?.slug).toBe('abc123')
    expect(shortUrl.value?.link).toBe('https://example.com')
    expect(shortUrl.value?.click_count).toBe(42)
    expect(shortUrl.value?.is_enabled).toBe(true)
    expect(isLoading.value).toBe(false)
    expect(hasError.value).toBe(false)
  })

  it('fetchShortUrl sets hasError on API error', async () => {
    mockGet.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })

    const { useShortUrlDetail } = await import('@/composables/useShortUrlDetail')
    const id = ref<number | null>(1)
    const { shortUrl, hasError, fetchShortUrl } = useShortUrlDetail(id)

    await fetchShortUrl()

    expect(hasError.value).toBe(true)
    expect(shortUrl.value).toBeNull()
  })

  it('fetchShortUrl sets hasError on thrown exception', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'))

    const { useShortUrlDetail } = await import('@/composables/useShortUrlDetail')
    const id = ref<number | null>(1)
    const { hasError, fetchShortUrl } = useShortUrlDetail(id)

    await fetchShortUrl()

    expect(hasError.value).toBe(true)
  })

  it('updateShortUrl calls PUT with correct data and returns true', async () => {
    mockPut.mockResolvedValueOnce({ data: { data: { ...shortUrlFixture, slug: 'new-slug' } }, error: null })

    const { useShortUrlDetail } = await import('@/composables/useShortUrlDetail')
    const id = ref<number | null>(1)
    const { shortUrl, hasError, updateShortUrl } = useShortUrlDetail(id)

    const result = await updateShortUrl({ slug: 'new-slug' })

    expect(result).toBe(true)
    expect(mockPut).toHaveBeenCalledWith('/short-urls/{shortUrl}', expect.anything())
    expect(shortUrl.value?.slug).toBe('new-slug')
    expect(hasError.value).toBe(false)
  })

  it('updateShortUrl returns false on API error', async () => {
    mockPut.mockResolvedValueOnce({ data: null, error: { message: 'Unprocessable' } })

    const { useShortUrlDetail } = await import('@/composables/useShortUrlDetail')
    const id = ref<number | null>(1)
    const { hasError, updateShortUrl } = useShortUrlDetail(id)

    const result = await updateShortUrl({ slug: 'bad-slug' })

    expect(result).toBe(false)
    expect(hasError.value).toBe(true)
  })

  it('updateShortUrl returns false on thrown exception', async () => {
    mockPut.mockRejectedValueOnce(new Error('Network error'))

    const { useShortUrlDetail } = await import('@/composables/useShortUrlDetail')
    const id = ref<number | null>(1)
    const { hasError, updateShortUrl } = useShortUrlDetail(id)

    const result = await updateShortUrl({ slug: 'bad-slug' })

    expect(result).toBe(false)
    expect(hasError.value).toBe(true)
  })

  it('deleteShortUrl calls DELETE and returns true', async () => {
    mockDelete.mockResolvedValueOnce({ error: null })

    const { useShortUrlDetail } = await import('@/composables/useShortUrlDetail')
    const id = ref<number | null>(1)
    const { hasError, deleteShortUrl } = useShortUrlDetail(id)

    const result = await deleteShortUrl()

    expect(result).toBe(true)
    expect(mockDelete).toHaveBeenCalledWith('/short-urls/{shortUrl}', expect.anything())
    expect(hasError.value).toBe(false)
  })

  it('deleteShortUrl returns false on API error', async () => {
    mockDelete.mockResolvedValueOnce({ error: { message: 'Forbidden' } })

    const { useShortUrlDetail } = await import('@/composables/useShortUrlDetail')
    const id = ref<number | null>(1)
    const { hasError, deleteShortUrl } = useShortUrlDetail(id)

    const result = await deleteShortUrl()

    expect(result).toBe(false)
    expect(hasError.value).toBe(true)
  })

  it('deleteShortUrl returns false on thrown exception', async () => {
    mockDelete.mockRejectedValueOnce(new Error('Network error'))

    const { useShortUrlDetail } = await import('@/composables/useShortUrlDetail')
    const id = ref<number | null>(1)
    const { hasError, deleteShortUrl } = useShortUrlDetail(id)

    const result = await deleteShortUrl()

    expect(result).toBe(false)
    expect(hasError.value).toBe(true)
  })

  it('watch triggers fetchShortUrl when shortUrlId changes', async () => {
    mockGet.mockResolvedValue({ data: { data: shortUrlFixture }, error: null })

    const { useShortUrlDetail } = await import('@/composables/useShortUrlDetail')
    const id = ref<number | null>(null)
    useShortUrlDetail(id)

    expect(mockGet).not.toHaveBeenCalled()

    id.value = 1
    await nextTick()
    await nextTick()

    expect(mockGet).toHaveBeenCalledTimes(1)
  })
})
