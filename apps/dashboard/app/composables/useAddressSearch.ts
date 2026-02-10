import { ref, watch } from 'vue'

export interface AddressResult {
  label: string
  lat: number
  lng: number
  postcode: string
  city: string
}

interface GeoFeature {
  properties: Record<string, string>
  geometry: { coordinates: number[] }
}

export function useAddressSearch() {
  const query = ref('')
  const results = ref<AddressResult[]>([])
  const isSearching = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watch(query, (val) => {
    if (debounceTimer) clearTimeout(debounceTimer)

    if (val.length < 3) {
      results.value = []
      return
    }

    debounceTimer = setTimeout(async () => {
      isSearching.value = true
      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(val)}&limit=5`,
        )
        const data = await response.json()
        results.value = (data.features ?? []).map((f: GeoFeature) => ({
          label: f.properties.label,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          postcode: f.properties.postcode,
          city: f.properties.city,
        }))
      }
      catch {
        results.value = []
      }
      finally {
        isSearching.value = false
      }
    }, 300)
  })

  function clear() {
    query.value = ''
    results.value = []
  }

  return {
    query,
    results,
    isSearching,
    clear,
  }
}
