import type { GeoFeature, AddressResult, SmartSearchResult } from '@/types/targeting'

export async function fetchAddresses(query: string, signal: AbortSignal, limit = 5): Promise<AddressResult[]> {
  const response = await fetch(
    `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=${limit}`,
    { signal },
  )
  const data = await response.json()
  return (data.features ?? []).map((f: GeoFeature) => ({
    label: f.properties.label,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    postcode: f.properties.postcode,
    city: f.properties.city,
  }))
}

export async function fetchMunicipalities(query: string, signal: AbortSignal, limit = 5): Promise<SmartSearchResult[]> {
  const response = await fetch(
    `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=${limit}`,
    { signal },
  )
  const data = await response.json()
  return (data.features ?? []).map((f: GeoFeature) => ({
    type: 'postcode' as const,
    label: f.properties.label,
    postcode: f.properties.postcode,
    city: f.properties.city,
  }))
}
