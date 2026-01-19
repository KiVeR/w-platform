export const PAGE_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const

export type PageStatusType = typeof PAGE_STATUS[keyof typeof PAGE_STATUS]

export const CAMPAIGN_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
} as const

export type CampaignStatusType = typeof CAMPAIGN_STATUS[keyof typeof CAMPAIGN_STATUS]

// UI Labels for statuses (French)
export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Actif',
  PAUSED: 'En pause',
  COMPLETED: 'Terminé',
  PUBLISHED: 'Publié',
  ARCHIVED: 'Archivé',
}

// UI Colors for status badges (Tailwind classes)
export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
}
