import type { AIImageInput } from '#shared/types/ai'

/** Maximum image size in bytes (4MB) */
const MAX_IMAGE_SIZE = 4 * 1024 * 1024

/** Supported MIME types */
const SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
] as const

type SupportedMimeType = typeof SUPPORTED_MIME_TYPES[number]

export interface ImageValidationResult {
  valid: boolean
  error?: string
  image?: AIImageInput
}

/**
 * Validate and prepare an image for the AI API
 *
 * @param base64Data - Base64 encoded image data (with or without data: prefix)
 * @param mimeType - MIME type of the image
 */
export function validateImage(
  base64Data: string,
  mimeType: string,
): ImageValidationResult {
  // Validate MIME type
  if (!SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType)) {
    return {
      valid: false,
      error: `Unsupported image type: ${mimeType}. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`,
    }
  }

  // Remove data URL prefix if present
  let cleanBase64 = base64Data
  if (base64Data.startsWith('data:')) {
    const match = base64Data.match(/^data:[^;]+;base64,(.+)$/)
    if (match) {
      cleanBase64 = match[1]
    }
    else {
      return {
        valid: false,
        error: 'Invalid data URL format',
      }
    }
  }

  // Validate base64 format
  if (!/^[A-Z0-9+/=]+$/i.test(cleanBase64)) {
    return {
      valid: false,
      error: 'Invalid base64 encoding',
    }
  }

  // Calculate approximate size (base64 is ~33% larger than binary)
  const approximateSize = Math.ceil((cleanBase64.length * 3) / 4)
  if (approximateSize > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Image too large (${Math.round(approximateSize / 1024 / 1024 * 100) / 100}MB). Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
    }
  }

  return {
    valid: true,
    image: {
      data: cleanBase64,
      mimeType: mimeType as AIImageInput['mimeType'],
    },
  }
}

/**
 * Extract MIME type from a data URL
 */
export function extractMimeType(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:([^;]+);base64,/)
  return match ? match[1] : null
}

/**
 * Check if a string is a valid base64 image
 */
export function isValidBase64Image(data: string): boolean {
  // Check for data URL format
  if (data.startsWith('data:image/')) {
    const mimeType = extractMimeType(data)
    return mimeType !== null && SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType)
  }

  // Check for raw base64 (must be provided with separate mimeType)
  return /^[A-Z0-9+/=]+$/i.test(data)
}

/**
 * Prepare image for Anthropic API format
 */
export function prepareForAnthropicApi(image: AIImageInput): {
  type: 'image'
  source: {
    type: 'base64'
    media_type: string
    data: string
  }
} {
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: image.mimeType,
      data: image.data,
    },
  }
}

/**
 * Prepare image for OpenAI-compatible API format
 *
 * OpenAI Vision API expects images as data URLs or http URLs.
 * This function converts the base64 image to a data URL format.
 */
export function prepareForOpenAIApi(
  image: AIImageInput,
  detail: 'auto' | 'low' | 'high' = 'auto',
): {
  type: 'image_url'
  image_url: {
    url: string
    detail: 'auto' | 'low' | 'high'
  }
} {
  return {
    type: 'image_url',
    image_url: {
      url: `data:${image.mimeType};base64,${image.data}`,
      detail,
    },
  }
}
