export interface PartnerRow {
  id: number
  name: string
  code: string | null
  activity_type: string | null
  email: string | null
  euro_credits: number
  is_active: boolean
  users_count: number
  shops_count: number
  created_at: string
}

export interface PartnerFilters {
  name?: string
  is_active?: boolean | null
  adv_id?: number
}

export interface PartnerPagination {
  page: number
  lastPage: number
  total: number
}

export interface PartnerFormData {
  name: string
  code?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  zip_code?: string
  activity_type?: string
  is_active?: boolean
  router_id?: number
  billing_mode?: string
}

export interface PartnerFeature {
  key: string
  is_enabled: boolean
}
