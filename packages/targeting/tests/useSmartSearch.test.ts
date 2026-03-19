import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useSmartSearch } from '../composables/useSmartSearch'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockAddressResponse(features: { label: string, lat: number, lng: number }[]) {
  return {
    json: () => Promise.resolve({
      features: features.map(f => ({
        properties: { label: f.label },
        geometry: { coordinates: [f.lng, f.lat] },
      })),
    }),
  }
}

function mockMunicipalityResponse(features: { label: string, postcode: string, city: string }[]) {
  return {
    json: () => Promise.resolve({
      features: features.map(f => ({
        properties: { label: f.label, postcode: f.postcode, city: f.city },
        geometry: { coordinates: [0, 0] },
      })),
    }),
  }
}

describe('useSmartSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with empty state', () => {
    const { query, isSearching, hasResults, groupedResults } = useSmartSearch()
    expect(query.value).toBe('')
    expect(isSearching.value).toBe(false)
    expect(hasResults.value).toBe(false)
    expect(groupedResults.value.departments).toHaveLength(0)
    expect(groupedResults.value.addresses).toHaveLength(0)
    expect(groupedResults.value.postcodes).toHaveLength(0)
  })

  it('does not search with empty query', async () => {
    const { query, hasResults } = useSmartSearch()
    query.value = ''
    await nextTick()
    vi.advanceTimersByTime(500)
    expect(mockFetch).not.toHaveBeenCalled()
    expect(hasResults.value).toBe(false)
  })

  it('searches departments from first character', async () => {
    const { query, groupedResults } = useSmartSearch()
    query.value = 'A'
    await nextTick()
    expect(groupedResults.value.departments.length).toBeGreaterThan(0)
  })

  it('filters departments locally by code', async () => {
    const { query, groupedResults } = useSmartSearch()
    query.value = '75'
    await nextTick()
    // Department filtering is instant (not debounced)
    expect(groupedResults.value.departments.length).toBeGreaterThan(0)
    expect(groupedResults.value.departments.at(0)?.departmentCode).toBe('75')
    expect(groupedResults.value.departments.at(0)?.type).toBe('department')
  })

  it('filters departments locally by name', async () => {
    const { query, groupedResults } = useSmartSearch()
    query.value = 'Ain'
    await nextTick()
    const depts = groupedResults.value.departments
    expect(depts.length).toBeGreaterThan(0)
    expect(depts.some(d => d.departmentCode === '01')).toBe(true)
  })

  it('filters departments with accent-insensitive search', async () => {
    const { query, groupedResults } = useSmartSearch()
    query.value = 'ardeche'
    await nextTick()
    const depts = groupedResults.value.departments
    expect(depts.some(d => d.departmentCode === '07')).toBe(true)
  })

  it('searches addresses via API for general text after debounce', async () => {
    mockFetch.mockResolvedValue(mockAddressResponse([
      { label: '12 rue de Lyon, 69007', lat: 45.75, lng: 4.85 },
    ]))

    const { query, groupedResults } = useSmartSearch()
    query.value = '12 rue de Lyon'
    await nextTick()
    await vi.advanceTimersByTimeAsync(400)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api-adresse.data.gouv.fr/search/?q=12'),
      expect.any(Object),
    )
    expect(groupedResults.value.addresses).toHaveLength(1)
    expect(groupedResults.value.addresses.at(0)?.type).toBe('address')
    expect(groupedResults.value.addresses.at(0)?.lat).toBe(45.75)
  })

  it('searches municipalities for postcode-like input', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('type=municipality')) {
        return Promise.resolve(mockMunicipalityResponse([
          { label: 'Paris 1er Arrondissement', postcode: '75001', city: 'Paris' },
        ]))
      }
      return Promise.resolve(mockAddressResponse([]))
    })

    const { query, groupedResults } = useSmartSearch()
    query.value = '75001'
    await nextTick()
    await vi.advanceTimersByTimeAsync(400)

    expect(groupedResults.value.postcodes).toHaveLength(1)
    expect(groupedResults.value.postcodes.at(0)?.type).toBe('postcode')
    expect(groupedResults.value.postcodes.at(0)?.postcode).toBe('75001')
  })

  it('searches municipalities for department code input', async () => {
    mockFetch.mockResolvedValue(mockMunicipalityResponse([
      { label: 'Paris', postcode: '75000', city: 'Paris' },
    ]))

    const { query, groupedResults } = useSmartSearch()
    query.value = '75'
    await nextTick()
    await vi.advanceTimersByTimeAsync(400)

    // Should match departments locally AND municipalities via API
    expect(groupedResults.value.departments.length).toBeGreaterThan(0)
    expect(mockFetch).toHaveBeenCalled()
  })

  it('clear resets all results', async () => {
    const { query, groupedResults, clear } = useSmartSearch()
    query.value = '75'
    await nextTick()
    expect(groupedResults.value.departments.length).toBeGreaterThan(0)

    clear()
    await nextTick()
    expect(query.value).toBe('')
    expect(groupedResults.value.departments).toHaveLength(0)
    expect(groupedResults.value.addresses).toHaveLength(0)
    expect(groupedResults.value.postcodes).toHaveLength(0)
  })

  it('handles fetch errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const { query, groupedResults, isSearching } = useSmartSearch()
    query.value = '12 rue de test'
    await nextTick()
    await vi.advanceTimersByTimeAsync(400)

    expect(isSearching.value).toBe(false)
    expect(groupedResults.value.addresses).toHaveLength(0)
  })

  it('limits department results to 5', async () => {
    const { query, groupedResults } = useSmartSearch()
    // "a" matches many departments (Ain, Aisne, Allier, Alpes-de-Haute-Provence, etc.)
    query.value = 'al'
    await nextTick()
    expect(groupedResults.value.departments.length).toBeLessThanOrEqual(5)
  })

  it('debounces API calls (rapid typing)', async () => {
    mockFetch.mockResolvedValue(mockAddressResponse([]))

    const { query } = useSmartSearch()
    query.value = 'Par'
    await nextTick()
    vi.advanceTimersByTime(100)
    query.value = 'Pari'
    await nextTick()
    vi.advanceTimersByTime(100)
    query.value = 'Paris'
    await nextTick()
    await vi.advanceTimersByTimeAsync(400)

    // Only 1 API call for "Paris" (previous ones cancelled by debounce)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('Paris'),
      expect.any(Object),
    )
  })

  it('hasResults is true when any group has results', async () => {
    const { query, hasResults } = useSmartSearch()
    query.value = '75'
    await nextTick()
    // Department 75 matched locally
    expect(hasResults.value).toBe(true)
  })

  it('result labels include department code and name', async () => {
    const { query, groupedResults } = useSmartSearch()
    query.value = 'Paris'
    await nextTick()
    const paris = groupedResults.value.departments.find(d => d.departmentCode === '75')
    expect(paris?.label).toBe('75 — Paris')
  })
})
