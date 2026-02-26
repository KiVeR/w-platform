export type TargetingMethod = 'department' | 'postcode' | 'address' | 'commune' | 'iris'

export interface CampaignTargeting {
  method: TargetingMethod
  departments: string[]
  postcodes: string[]
  communes: string[]
  iris_codes: string[]
  address: string | null
  lat: number | null
  lng: number | null
  radius: number | null
}

export interface AddressResult {
  label: string
  lat: number
  lng: number
  postcode: string
  city: string
}

export interface SmartSearchResult {
  type: TargetingMethod
  label: string
  departmentCode?: string
  departmentName?: string
  postcode?: string
  city?: string
  lat?: number
  lng?: number
}

export interface CommuneSearchResult {
  nom: string
  code: string
  codesPostaux: string[]
  population: number | null
}

export interface GeoFeature {
  properties: Record<string, string>
  geometry: { coordinates: number[] }
}

export interface CommuneFeatureProperties {
  nom: string
  code: string
  codesPostaux: string[]
  selectedPostcodes: string[]
  population: number | null
}
