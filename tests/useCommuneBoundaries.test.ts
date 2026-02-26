import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, watch, nextTick } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('watch', watch)

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

vi.mock('@/types/targeting', () => ({}))

const { useCommuneBoundaries } = await import('@/composables/useCommuneBoundaries')

function makeCommuneResponse(code: string, nom: string, codesPostaux: string[], population: number) {
  return {
    nom,
    code,
    codesPostaux,
    population,
    contour: { type: 'Polygon', coordinates: [[[2.3, 48.8], [2.4, 48.8], [2.4, 48.9], [2.3, 48.9], [2.3, 48.8]]] },
  }
}

function mockFetchSuccess(data: unknown[]) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  })
}

describe('useCommuneBoundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null when postcodes is empty', async () => {
    const postcodes = ref<string[]>([])
    const { communeGeoJson } = useCommuneBoundaries(postcodes)
    await nextTick()
    expect(communeGeoJson.value).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('fetches from geo.api.gouv.fr with correct URL', async () => {
    mockFetchSuccess([makeCommuneResponse('77288', 'Melun', ['77000'], 42000)])

    const postcodes = ref(['77000'])
    useCommuneBoundaries(postcodes)

    await vi.advanceTimersByTimeAsync(200)
    await nextTick()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://geo.api.gouv.fr/communes?codePostal=77000&fields=nom,code,codesPostaux,population,contour',
      expect.any(Object),
    )
  })

  it('debounces 200ms on rapid postcode changes', async () => {
    mockFetchSuccess([makeCommuneResponse('75056', 'Paris', ['75001'], 2200000)])

    const postcodes = ref(['75001'])
    useCommuneBoundaries(postcodes)

    await vi.advanceTimersByTimeAsync(100)
    postcodes.value = ['75001', '75002']
    await nextTick()

    await vi.advanceTimersByTimeAsync(100)
    expect(mockFetch).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(200)
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()

    expect(mockFetch).toHaveBeenCalled()
  })

  it('maps API response to GeoJSON FeatureCollection', async () => {
    mockFetchSuccess([makeCommuneResponse('77288', 'Melun', ['77000'], 42000)])

    const postcodes = ref(['77000'])
    const { communeGeoJson } = useCommuneBoundaries(postcodes)

    await vi.advanceTimersByTimeAsync(200)
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()

    expect(communeGeoJson.value).not.toBeNull()
    expect(communeGeoJson.value!.type).toBe('FeatureCollection')
    expect(communeGeoJson.value!.features).toHaveLength(1)

    const feature = communeGeoJson.value!.features[0]
    expect(feature.type).toBe('Feature')
    expect(feature.properties.nom).toBe('Melun')
    expect(feature.properties.code).toBe('77288')
    expect(feature.properties.selectedPostcodes).toEqual(['77000'])
    expect(feature.properties.population).toBe(42000)
    expect(feature.geometry).toBeDefined()
  })

  it('deduplicates communes by INSEE code', async () => {
    const commune = makeCommuneResponse('75056', 'Paris', ['75001', '75002'], 2200000)
    mockFetch.mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([commune]),
    }))

    const postcodes = ref(['75001', '75002'])
    const { communeGeoJson } = useCommuneBoundaries(postcodes)

    await vi.advanceTimersByTimeAsync(200)
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()

    expect(communeGeoJson.value!.features).toHaveLength(1)
    expect(communeGeoJson.value!.features[0].properties.selectedPostcodes).toEqual(['75001', '75002'])
  })

  it('handles fetch error gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const postcodes = ref(['99999'])
    const { communeGeoJson, isLoading } = useCommuneBoundaries(postcodes)

    await vi.advanceTimersByTimeAsync(200)
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()

    expect(communeGeoJson.value).toEqual({ type: 'FeatureCollection', features: [] })
    expect(isLoading.value).toBe(false)
  })

  it('handles non-ok HTTP response', async () => {
    mockFetch.mockResolvedValue({ ok: false })

    const postcodes = ref(['99999'])
    const { communeGeoJson } = useCommuneBoundaries(postcodes)

    await vi.advanceTimersByTimeAsync(200)
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()

    expect(communeGeoJson.value!.features).toHaveLength(0)
  })

  it('filters out communes without contour', async () => {
    mockFetchSuccess([
      makeCommuneResponse('77288', 'Melun', ['77000'], 42000),
      { nom: 'NoContour', code: '77999', codesPostaux: ['77000'], population: 100, contour: null },
    ])

    const postcodes = ref(['77000'])
    const { communeGeoJson } = useCommuneBoundaries(postcodes)

    await vi.advanceTimersByTimeAsync(200)
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()

    expect(communeGeoJson.value!.features).toHaveLength(1)
    expect(communeGeoJson.value!.features[0].properties.nom).toBe('Melun')
  })

  it('loading state is false after fetch completes', async () => {
    mockFetchSuccess([makeCommuneResponse('77288', 'Melun', ['77000'], 42000)])

    const postcodes = ref(['77000'])
    const { isLoading, communeGeoJson } = useCommuneBoundaries(postcodes)

    expect(isLoading.value).toBe(false)

    await vi.advanceTimersByTimeAsync(200)
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()

    expect(isLoading.value).toBe(false)
    expect(communeGeoJson.value).not.toBeNull()
  })

  it('clears geojson when postcodes becomes empty', async () => {
    mockFetchSuccess([makeCommuneResponse('77288', 'Melun', ['77000'], 42000)])

    const postcodes = ref(['77000'])
    const { communeGeoJson } = useCommuneBoundaries(postcodes)

    await vi.advanceTimersByTimeAsync(200)
    await nextTick()
    await vi.advanceTimersByTimeAsync(0)
    await nextTick()

    expect(communeGeoJson.value).not.toBeNull()

    postcodes.value = []
    await nextTick()

    expect(communeGeoJson.value).toBeNull()
  })
})
