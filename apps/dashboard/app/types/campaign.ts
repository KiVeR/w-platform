import type { CampaignStatus } from '@/components/shared/CampaignStatusBadge.vue'

export type { CampaignStatus }
export type CampaignType = 'prospection' | 'fidelisation' | 'comptage'
export type CampaignChannel = 'sms' | 'email'

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
