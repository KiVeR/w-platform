import type { CampaignStatusType } from '../constants/status'
import type { ContentType } from './content'

// Re-export status constants for convenience
export { CAMPAIGN_STATUS, type CampaignStatusType } from '../constants/status'

export interface Campaign {
  id: number
  title: string
  description?: string | null
  status: CampaignStatusType
  enabledContentTypes: ContentType[]
  ownerId: number
  createdAt: Date
  updatedAt: Date
}

export interface CampaignWithContents extends Campaign {
  contents: Array<{
    id: number
    type: ContentType
    title: string
    status: string
  }>
  _count?: {
    contents: number
  }
}

export interface CampaignListItem {
  id: number
  title: string
  description?: string | null
  status: CampaignStatusType
  enabledContentTypes: ContentType[]
  createdAt: Date
  updatedAt: Date
  _count: {
    contents: number
  }
  contentTypeSummary: ContentType[]
}
