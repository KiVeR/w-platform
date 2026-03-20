export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  image?: AIImageInput
  design?: unknown // DesignDocument
  createdAt: Date
}

export interface AIImageInput {
  data: string
  mimeType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'
}

export interface AIQuotaInfo {
  remaining: number
  limit: number
  resets_at: string
  can_generate: boolean
}

export interface AIGenerateResponse {
  job_id: string
  status: 'pending'
}

export interface AIJobStatusResponse {
  status: 'pending' | 'completed' | 'failed'
  design?: Record<string, unknown>
  description?: string
  usage?: { input_tokens: number; output_tokens: number }
  error?: string
}
