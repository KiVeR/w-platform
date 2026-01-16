export const PAGE_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const

export type PageStatusType = typeof PAGE_STATUS[keyof typeof PAGE_STATUS]
