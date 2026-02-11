import type { Component } from 'vue'
import type { CampaignStatus } from '@/components/shared/CampaignStatusBadge.vue'

export type { CampaignStatus }
export type CampaignType = 'prospection' | 'fidelisation' | 'comptage'
export type CampaignChannel = 'sms' | 'email'
export type TargetingMethod = 'department' | 'postcode' | 'address'
export type Gender = 'M' | 'F' | null
export type LandingPageStatus = 'draft' | 'published' | 'archived'

export interface CampaignTargeting {
  method: TargetingMethod
  departments: string[]
  postcodes: string[]
  address: string | null
  lat: number | null
  lng: number | null
  radius: number | null
  gender: Gender
  age_min: number | null
  age_max: number | null
}

export interface CanonicalZone {
  code: string
  type: string
  label: string
  volume: number
}

export interface CanonicalTargeting {
  method: TargetingMethod
  input: Record<string, unknown>
  zones: CanonicalZone[]
  origin: { address: string, lat: number, lng: number, radius: number } | null
  demographics: { gender: Gender, age_min: number | null, age_max: number | null } | null
}

export interface LandingPageRow {
  id: number
  name: string
  status: LandingPageStatus
  is_active: boolean
  created_at: string
}

export interface CampaignDraft {
  type: CampaignType
  channel: CampaignChannel
  name: string
  sender: string
  message: string
  targeting: CampaignTargeting
  scheduled_at: string | null
  landing_page_id: number | null
  is_demo: boolean
  additional_phone: string | null
}

export interface WizardStep {
  key: string
  labelKey: string
  icon: Component
}

export interface CampaignEstimate {
  volume: number
  unitPrice: number
  totalPrice: number
  smsCount: number
}

export interface CampaignRow {
  id: number
  name: string
  type: CampaignType
  status: CampaignStatus
  is_demo: boolean
  volume_estimated: number | null
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
}

export interface CampaignPagination {
  page: number
  lastPage: number
  total: number
}

export interface CampaignFilters {
  search: string
  status: string
  type: string
}
