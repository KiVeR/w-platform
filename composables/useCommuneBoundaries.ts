import { ref, watch, type Ref } from 'vue'
import { createLruCache } from '@/utils/lru-cache'
import { createDebouncedFetcher } from '@/utils/debounce-lifecycle'
import type { CommuneFeatureProperties } from '@/types/targeting'

interface GeoJsonFeature {
  type: 'Feature'
  properties: CommuneFeatureProperties
  geometry: Record<string, unknown>
}

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

interface CommuneApiResponse {
  nom: string
  code: string
  codesPostaux: string[]
  population: number | null
  contour: Record<string, unknown> | null
}

const cache = createLruCache<GeoJsonFeature[]>(200)

async function fetchCommunes(postcode: string, signal: AbortSignal): Promise<GeoJsonFeature[]> {
  try {
    const response = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${postcode}&fields=nom,code,codesPostaux,population,contour`,
      { signal },
    )
    if (!response.ok) return []
    const data: CommuneApiResponse[] = await response.json()
    return data
      .filter(c => c.contour)
      .map(c => ({
        type: 'Feature' as const,
        properties: {
          nom: c.nom,
          code: c.code,
          codesPostaux: c.codesPostaux,
          selectedPostcodes: [],
          population: c.population,
        },
        geometry: c.contour!,
      }))
  }
  catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    return []
  }
}

function buildFeatureCollection(postcodes: string[]): GeoJsonFeatureCollection {
  const seen = new Map<string, GeoJsonFeature>()

  for (const postcode of postcodes) {
    const features = cache.get(postcode)
    if (!features) continue
    for (const feature of features) {
      const existing = seen.get(feature.properties.code)
      if (existing) {
        if (!existing.properties.selectedPostcodes.includes(postcode)) {
          existing.properties.selectedPostcodes.push(postcode)
        }
      }
      else {
        seen.set(feature.properties.code, {
          ...feature,
          properties: {
            ...feature.properties,
            selectedPostcodes: [postcode],
          },
        })
      }
    }
  }

  return { type: 'FeatureCollection', features: [...seen.values()] }
}

export function useCommuneBoundaries(postcodes: Ref<string[]>) {
  const communeGeoJson = ref<GeoJsonFeatureCollection | null>(null)
  const isLoading = ref(false)
  const { schedule, cancel } = createDebouncedFetcher(200)

  watch(postcodes, (codes) => {
    cancel()

    if (codes.length === 0) {
      communeGeoJson.value = null
      return
    }

    schedule(async (signal) => {
      isLoading.value = true
      try {
        const uncached = codes.filter(c => !cache.has(c))
        if (uncached.length > 0) {
          const results = await Promise.all(uncached.map(async (code) => {
            const features = await fetchCommunes(code, signal)
            return { code, features }
          }))
          for (const { code, features } of results) {
            cache.set(code, features)
          }
        }

        communeGeoJson.value = buildFeatureCollection(codes)
      }
      catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') throw err
        communeGeoJson.value = null
      }
      finally {
        isLoading.value = false
      }
    })
  }, { immediate: true })

  return { communeGeoJson, isLoading }
}
