import type { DesignDocument } from '../../src/types/widget'
import type { PageStatusType } from '../constants/status'

export const CONTENT_TYPES = ['landing-page', 'rcs', 'sms'] as const
export type ContentType = typeof CONTENT_TYPES[number]

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  'landing-page': 'Page web',
  'rcs': 'Message RCS',
  'sms': 'Message SMS',
}

export const CONTENT_TYPE_ICONS: Record<ContentType, string> = {
  'landing-page': 'globe',
  'rcs': 'message-circle',
  'sms': 'smartphone',
}

// Emoji icons for UI display
export const CONTENT_TYPE_EMOJI: Record<ContentType, string> = {
  'landing-page': '🌐',
  'rcs': '💬',
  'sms': '📱',
}

// Base content interface
export interface BaseContent {
  id: number
  type: ContentType
  title: string
  status: PageStatusType
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
}

// Landing Page content
export interface LandingPageContent extends BaseContent {
  type: 'landing-page'
  landingPageData?: {
    id: number
    design: DesignDocument
  } | null
}

// RCS content (placeholder for now)
export interface RCSMessage {
  sender?: string
  cards?: unknown[]
  suggestions?: unknown[]
}

export interface RCSContent extends BaseContent {
  type: 'rcs'
  rcsData?: {
    id: number
    message: RCSMessage | null
  } | null
}

// SMS content (placeholder for now)
export interface SMSMessage {
  text?: string
  encoding?: 'gsm7' | 'ucs2'
  segments?: number
  variables?: Array<{ name: string, fallback: string }>
}

export interface SMSContent extends BaseContent {
  type: 'sms'
  smsData?: {
    id: number
    message: SMSMessage | null
  } | null
}

// Union type for all content types
export type Content = LandingPageContent | RCSContent | SMSContent

// List item for dashboard
export interface ContentListItem {
  id: number
  type: ContentType
  title: string
  status: PageStatusType
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
}

// Dashboard contents response
export interface ContentsListResponse {
  data: ContentListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Recent contents response
export interface RecentContentsResponse {
  recent: ContentListItem[]
  favorites: ContentListItem[]
}

// Helper to check if editor is available for a content type
export function isEditorAvailable(type: ContentType): boolean {
  return type === 'landing-page'
}

// Helper to get content type from string
export function isValidContentType(value: string): value is ContentType {
  return CONTENT_TYPES.includes(value as ContentType)
}
