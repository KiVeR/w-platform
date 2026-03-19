import type { RoleType } from '../constants/roles'

// =============================================================================
// IMAGE INPUT
// =============================================================================

export interface AIImageInput {
  /** Base64-encoded image data (without data: prefix) */
  data: string
  /** MIME type of the image */
  mimeType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'
}

// =============================================================================
// CHAT MESSAGES
// =============================================================================

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** Attached image (user messages only) */
  image?: AIImageInput
  /** Generated design (assistant messages only) */
  design?: unknown // DesignDocument - avoid circular import
  /** Timestamp */
  createdAt: Date
}

// =============================================================================
// GENERATION INPUT/OUTPUT
// =============================================================================

export interface AIGenerationInput {
  /** User prompt describing the desired design */
  prompt: string
  /** Optional image attachment (screenshot, mockup) */
  image?: AIImageInput
  /** Previous messages for context (conversation mode) */
  conversationHistory?: AIChatMessage[]
  /** Additional context about the current document */
  context?: AIGenerationContext
}

export interface AIGenerationContext {
  /** Current number of widgets in the document */
  currentWidgets?: number
  /** Content type being edited */
  contentType?: 'landing-page' | 'rcs' | 'sms'
  /** Current design for reference (partial updates) */
  currentDesign?: unknown
}

// =============================================================================
// STREAMING CHUNKS (SSE)
// =============================================================================

export type AIStreamChunk
  = | AIStreamTokenChunk
    | AIStreamDesignChunk
    | AIStreamErrorChunk
    | AIStreamDoneChunk

export interface AIStreamTokenChunk {
  type: 'token'
  /** Text content being streamed */
  content: string
}

export interface AIStreamDesignChunk {
  type: 'design'
  /** Generated DesignDocument */
  content: unknown // DesignDocument
}

export interface AIStreamErrorChunk {
  type: 'error'
  /** Error message */
  content: string
  /** Error code for client handling */
  code?: 'RATE_LIMIT' | 'INVALID_IMAGE' | 'GENERATION_FAILED' | 'QUOTA_EXCEEDED'
}

export interface AIStreamDoneChunk {
  type: 'done'
  /** Token usage information */
  usage: AITokenUsage
}

export interface AITokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

// =============================================================================
// QUOTA MANAGEMENT
// =============================================================================

/** Monthly quota limits by role */
export const AI_QUOTA_BY_ROLE: Record<RoleType, number> = {
  VIEWER: 0,
  EDITOR: 20,
  ADMIN: 100,
}

export interface AIQuotaInfo {
  /** Remaining generations this month */
  remaining: number
  /** Total allowed this month */
  limit: number
  /** When the quota resets */
  resetsAt: Date
  /** Whether user can generate */
  canGenerate: boolean
}

export interface AIUsageRecord {
  userId: number
  /** Year-month key (e.g., '2026-01') */
  periodKey: string
  /** Number of generations used */
  count: number
  /** Last generation timestamp */
  lastGeneratedAt: Date
}

// =============================================================================
// API REQUEST/RESPONSE
// =============================================================================

export interface AIChatRequest {
  prompt: string
  image?: AIImageInput
  conversationHistory?: AIChatMessage[]
  context?: AIGenerationContext
}

export interface AIQuotaResponse {
  quota: AIQuotaInfo
}
