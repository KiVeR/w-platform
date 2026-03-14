import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, watch } from 'vue'
import { mockUseI18n } from './helpers/stubs'

mockUseI18n()

vi.stubGlobal('ref', ref)
vi.stubGlobal('watch', watch)

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const { useCommuneSearch } = await import('#targeting/composables/useCommuneSearch')

describe('useCommuneSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('returns empty for empty query', async () => {
    const { query, results } = useCommuneSearch()
    query.value = ''
    await vi.advanceTimersByTimeAsync(350)
    expect(results.value).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('searches from first character', async () => {
    const mockData = [
      { nom: 'Paris', code: '75056', codesPostaux: ['75001'], population: 2161000 },
    ]
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const { query, results } = useCommuneSearch()
    query.value = 'P'
    await vi.advanceTimersByTimeAsync(350)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('geo.api.gouv.fr/communes?nom=P'),
      expect.any(Object),
    )
    expect(results.value).toHaveLength(1)
  })

  it('returns communes for valid alphabetic query', async () => {
    const mockData = [
      { nom: 'Paris', code: '75056', codesPostaux: ['75001', '75002'], population: 2161000 },
    ]
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const { query, results } = useCommuneSearch()
    query.value = 'Paris'
    await vi.advanceTimersByTimeAsync(350)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('geo.api.gouv.fr/communes?nom=Paris'),
      expect.any(Object),
    )
    expect(results.value).toHaveLength(1)
    expect(results.value.at(0)?.nom).toBe('Paris')
  })

  it('caches results', async () => {
    const mockData = [
      { nom: 'Lyon', code: '69123', codesPostaux: ['69001'], population: 516092 },
    ]
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const { query, results } = useCommuneSearch()

    // First call
    query.value = 'Lyon'
    await vi.advanceTimersByTimeAsync(350)
    expect(results.value).toHaveLength(1)

    // Reset and search again
    query.value = ''
    await vi.advanceTimersByTimeAsync(50)
    query.value = 'Lyon'
    await vi.advanceTimersByTimeAsync(350)

    // fetch should have been called only once
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('searches by INSEE code (5 digits)', async () => {
    const mockData = [
      { nom: 'Lyon', code: '69123', codesPostaux: ['69001', '69002'], population: 516092 },
    ]
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const { query, results } = useCommuneSearch()
    query.value = '69123'
    await vi.advanceTimersByTimeAsync(350)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('geo.api.gouv.fr/communes?code=69123'),
      expect.any(Object),
    )
    expect(results.value).toHaveLength(1)
    expect(results.value.at(0)?.nom).toBe('Lyon')
  })

  it('rejects single digit queries', async () => {
    const { query, results } = useCommuneSearch()
    query.value = '1'
    await vi.advanceTimersByTimeAsync(350)
    expect(results.value).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('searches by partial code (2-4 digits) via codeDepartement', async () => {
    const mockData = [
      { nom: 'Lyon', code: '69123', codesPostaux: ['69001'], population: 516092 },
      { nom: 'Villeurbanne', code: '69266', codesPostaux: ['69100'], population: 150000 },
    ]
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const { query, results } = useCommuneSearch()
    query.value = '6912'
    await vi.advanceTimersByTimeAsync(350)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('codeDepartement=69'),
      expect.any(Object),
    )
    // Only Lyon matches prefix '6912'
    expect(results.value).toHaveLength(1)
    expect(results.value.at(0)?.code).toBe('69123')
  })

  it('searches by 2-digit department code', async () => {
    const mockData = [
      { nom: 'Paris', code: '75056', codesPostaux: ['75001'], population: 2161000 },
    ]
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const { query, results } = useCommuneSearch()
    query.value = '75'
    await vi.advanceTimersByTimeAsync(350)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('codeDepartement=75'),
      expect.any(Object),
    )
    expect(results.value).toHaveLength(1)
  })

  it('handles API errors gracefully', async () => {
    mockFetch.mockResolvedValue({ ok: false })

    const { query, results } = useCommuneSearch()
    query.value = 'Unknown'
    await vi.advanceTimersByTimeAsync(350)

    expect(results.value).toEqual([])
  })
})
