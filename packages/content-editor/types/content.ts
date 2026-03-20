// Content types needed by the editor layer
export const CONTENT_TYPES = ['landing-page', 'rcs', 'sms'] as const
export type ContentType = typeof CONTENT_TYPES[number]

export function isEditorAvailable(type: ContentType): boolean {
  return type === 'landing-page'
}

// Page status (editor-relevant subset)
export const PAGE_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const

export type PageStatusType = typeof PAGE_STATUS[keyof typeof PAGE_STATUS]

export const STATUS_LABELS: Record<PageStatusType, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  ARCHIVED: 'Archivé',
}

export const STATUS_COLORS: Record<PageStatusType, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
}
