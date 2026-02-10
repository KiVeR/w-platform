import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, watch, nextTick } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('watch', watch)

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const { useAddressSearch } = await import('@/composables/useAddressSearch')

describe('useAddressSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not search when query shorter than 3 chars', async () => {
    const { query } = useAddressSearch()
    query.value = 'ab'
    await vi.advanceTimersByTimeAsync(300)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('searches after 300ms debounce', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ features: [] }),
    })

    const { query } = useAddressSearch()
    query.value = 'Paris'
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api-adresse.data.gouv.fr/search/?q=Paris'),
    )
  })

  it('maps api-adresse response to AddressResult[]', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        features: [
          {
            properties: { label: '1 Rue de Paris, 75001 Paris', postcode: '75001', city: 'Paris' },
            geometry: { coordinates: [2.34, 48.86] },
          },
        ],
      }),
    })

    const { query, results } = useAddressSearch()
    query.value = 'Paris'
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()
    // Let the promise resolve
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()

    expect(results.value).toHaveLength(1)
    expect(results.value[0].label).toBe('1 Rue de Paris, 75001 Paris')
    expect(results.value[0].lat).toBe(48.86)
    expect(results.value[0].lng).toBe(2.34)
    expect(results.value[0].postcode).toBe('75001')
    expect(results.value[0].city).toBe('Paris')
  })

  it('clears results on clear()', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        features: [
          {
            properties: { label: 'Paris', postcode: '75000', city: 'Paris' },
            geometry: { coordinates: [2.34, 48.86] },
          },
        ],
      }),
    })

    const { query, results, clear } = useAddressSearch()
    query.value = 'Paris'
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()

    clear()
    expect(results.value).toHaveLength(0)
    expect(query.value).toBe('')
  })

  it('handles fetch error gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const { query, results, isSearching } = useAddressSearch()
    query.value = 'Paris'
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()

    expect(results.value).toHaveLength(0)
    expect(isSearching.value).toBe(false)
  })

  it('debounce resets on rapid input', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ features: [] }),
    })

    const { query } = useAddressSearch()
    query.value = 'Par'
    await vi.advanceTimersByTimeAsync(200)
    query.value = 'Paris'
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('q=Paris'),
    )
  })
})
