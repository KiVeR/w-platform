import type { Component } from 'vue'
import type { CampaignStatus } from '@/components/shared/CampaignStatusBadge.vue'

export type { CampaignStatus }
export type CampaignType = 'prospection' | 'fidelisation' | 'comptage'
export type CampaignChannel = 'sms' | 'email'
export type TargetingMethod = 'department' | 'postcode' | 'address' | 'commune' | 'iris'
export type Gender = 'M' | 'F' | null
export type LandingPageStatus = 'draft' | 'published' | 'archived'

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
  unitPrice: number | null
  totalPrice: number | null
  smsCount: number
  nextTier: {
    volumeThreshold: number
    unitPrice: number
    savingsPercent: number
  } | null
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
  statuses: CampaignStatus[]
  type: string
  dateFrom: string
  dateTo: string
}

export interface Shop {
  id: number
  name: string
  address: string | null
  city: string | null
  zip_code: string | null
  latitude: number | null
  longitude: number | null
}

export interface CampaignDetail {
  id: number
  partner_id: number
  user_id: number
  type: CampaignType
  channel: CampaignChannel
  status: CampaignStatus
  is_demo: boolean
  name: string
  targeting: string | null
  volume_estimated: number | null
  volume_sent: number | null
  message: string | null
  sender: string | null
  additional_phone: string | null
  sms_count: number
  short_url: string | null
  scheduled_at: string | null
  sent_at: string | null
  unit_price: string | null
  total_price: string | null
  created_at: string
  partner?: { id: number, name: string } | null
  creator?: { id: number, full_name: string } | null
}

export interface CampaignStats {
  sent: number
  delivered: number
  undeliverable: number
  rejected: number
  expired: number
  stop: number
  clicks: number
  deliverability_rate: number
  ctr: number
}

export interface TargetingTemplateRow {
  id: number
  partner_id: number | null
  name: string
  targeting_json: CampaignTargeting
  usage_count: number
  last_used_at: string | null
  is_preset: boolean
  category: string | null
  created_at: string
}

export type CampaignRecipientStatus =
  | 'QUEUED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'UNDELIVERABLE'
  | 'FAILED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELED'

export interface CampaignRecipientRow {
  id: number
  campaign_id: number
  status: CampaignRecipientStatus
  phone_number: string
  message_preview: string | null
  message_preview_length: number | null
  short_url_suffix: string | null
  short_url_slug: string | null
  short_url_click: number
  additional_information: Record<string, unknown> | null
  stop_requested_at: string | null
  delivered_at: string | null
}

export interface RecipientFilters {
  search: string
  statuses: CampaignRecipientStatus[]
}

export interface RecipientPagination {
  page: number
  lastPage: number
  total: number
  perPage: number
}

export interface CampaignLogRow {
  id: number
  campaign_id: number
  data: Record<string, unknown>
  created_at: string
}

export interface LogActivityRow {
  id: number
  event: string
  model_type: string | null
  model_id: number | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
}

export type CampaignRoutingStatus =
  | 'QUERY_PENDING'
  | 'QUERY_IN_PROGRESS'
  | 'QUERY_FAILED'
  | 'SHORT_URL_ERROR'
  | 'SHORT_URL_SUFFIX_PENDING'
  | 'SHORT_URL_SUFFIX_REQUESTED'
  | 'SHORT_URL_SUFFIX_FAILED'
  | 'MESSAGE_GENERATION_PENDING'
  | 'MESSAGE_GENERATION_REQUESTED'
  | 'MESSAGE_GENERATION_FAILED'
  | 'ROUTING_PENDING'
  | 'ROUTING_IN_PROGRESS'
  | 'ROUTING_COMPLETED'
  | 'ROUTING_PAUSED'
  | 'ROUTING_FAILED'
  | 'ROUTING_CANCELED'

export interface CampaignDetailEnriched extends CampaignDetail {
  routing_status: CampaignRoutingStatus | null
  router_id: number | null
  variable_schema_id: number | null
  routing_at: string | null
  recipients_count: number | null
  router?: { id: number, name: string, external_id: number | null } | null
}
