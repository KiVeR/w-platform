import type { H3Event } from 'h3'

// =============================================================================
// RATE LIMIT CONFIGURATION
// =============================================================================

export interface RateLimitConfig {
  /** Number of requests allowed per window */
  maxRequests: number
  /** Window duration in milliseconds */
  windowMs: number
  /** Key prefix for this rate limiter */
  keyPrefix: string
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Authentication: 5 attempts per 15 minutes (brute force protection)
  AUTH_LOGIN: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'rl:auth-login',
  },
  // Registration: 3 per hour per IP (spam protection)
  AUTH_REGISTER: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'rl:auth-register',
  },
  // Version restore: 10 per hour
  VERSION_RESTORE: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'rl:version-restore',
  },
  // Design save: 60 per minute
  DESIGN_SAVE: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'rl:design-save',
  },
  // Asset upload: 30 per hour
  ASSET_UPLOAD: {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'rl:asset-upload',
  },
  // Content creation: 50 per hour
  CONTENT_CREATE: {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'rl:content-create',
  },
} as const

// =============================================================================
// IN-MEMORY RATE LIMITER
// =============================================================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (for single-server deployment)
// For production with multiple servers, use Redis instead
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupExpiredEntries(): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return
  }

  lastCleanup = now
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}

// =============================================================================
// RATE LIMIT RESULT TYPE
// =============================================================================

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Number of remaining requests in the current window */
  remaining: number
  /** Timestamp when the rate limit resets */
  resetAt: Date
  /** Number of requests made in the current window */
  current: number
  /** Maximum requests allowed */
  limit: number
}

// =============================================================================
// RATE LIMIT FUNCTIONS
// =============================================================================

/**
 * Check rate limit for a given key and config.
 * Does NOT throw an error - returns the result for the caller to handle.
 *
 * @param key - Unique identifier (e.g., user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with remaining count and reset time
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanupExpiredEntries()

  const fullKey = `${config.keyPrefix}:${key}`
  const now = Date.now()

  let entry = rateLimitStore.get(fullKey)

  // Create new entry if doesn't exist or has expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    }
    rateLimitStore.set(fullKey, entry)
  }

  // Increment count
  entry.count++

  const remaining = Math.max(0, config.maxRequests - entry.count)
  const allowed = entry.count <= config.maxRequests

  return {
    allowed,
    remaining,
    resetAt: new Date(entry.resetAt),
    current: entry.count,
    limit: config.maxRequests,
  }
}

/**
 * Enforce rate limit - throws 429 error if limit exceeded.
 *
 * @param event - H3 event
 * @param userId - User ID for rate limiting
 * @param config - Rate limit configuration
 * @returns Rate limit result for including in response
 * @throws 429 Too Many Requests if limit exceeded
 */
export function enforceRateLimit(
  event: H3Event,
  userId: number,
  config: RateLimitConfig,
): RateLimitResult {
  const result = checkRateLimit(String(userId), config)

  // Set rate limit headers
  setHeader(event, 'X-RateLimit-Limit', String(config.maxRequests))
  setHeader(event, 'X-RateLimit-Remaining', String(result.remaining))
  setHeader(event, 'X-RateLimit-Reset', result.resetAt.toISOString())

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)
    setHeader(event, 'Retry-After', String(retryAfter))

    throw createError({
      statusCode: 429,
      message: `Trop de requêtes. Réessayez dans ${formatDuration(retryAfter * 1000)}.`,
      data: {
        remaining: result.remaining,
        resetAt: result.resetAt.toISOString(),
        retryAfterSeconds: retryAfter,
      },
    })
  }

  return result
}

/**
 * Get current rate limit status without incrementing counter.
 * Useful for displaying remaining quota to users.
 *
 * @param userId - User ID
 * @param config - Rate limit configuration
 * @returns Current rate limit status
 */
export function getRateLimitStatus(userId: number, config: RateLimitConfig): RateLimitResult {
  const fullKey = `${config.keyPrefix}:${String(userId)}`
  const now = Date.now()

  const entry = rateLimitStore.get(fullKey)

  if (!entry || entry.resetAt < now) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now + config.windowMs),
      current: 0,
      limit: config.maxRequests,
    }
  }

  return {
    allowed: entry.count < config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: new Date(entry.resetAt),
    current: entry.count,
    limit: config.maxRequests,
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format duration in human-readable format (French)
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    if (remainingMinutes > 0) {
      return `${hours}h${remainingMinutes}min`
    }
    return `${hours}h`
  }

  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  return `${seconds} seconde${seconds > 1 ? 's' : ''}`
}

/**
 * Format rate limit info for API response
 */
export function formatRateLimitForResponse(result: RateLimitResult): {
  remaining: number
  limit: number
  resetAt: string
} {
  return {
    remaining: result.remaining,
    limit: result.limit,
    resetAt: result.resetAt.toISOString(),
  }
}

/**
 * Get client IP address from H3 event.
 * Handles proxied requests (X-Forwarded-For, X-Real-IP).
 */
export function getClientIp(event: H3Event): string {
  const xForwardedFor = getHeader(event, 'x-forwarded-for')
  if (xForwardedFor) {
    // Take the first IP in the chain (original client)
    return xForwardedFor.split(',')[0].trim()
  }

  const xRealIp = getHeader(event, 'x-real-ip')
  if (xRealIp) {
    return xRealIp.trim()
  }

  // Fallback to request info
  return event.node.req.socket?.remoteAddress || 'unknown'
}

/**
 * Enforce rate limit by IP address - for unauthenticated endpoints.
 * Throws 429 error if limit exceeded.
 *
 * @param event - H3 event
 * @param config - Rate limit configuration
 * @returns Rate limit result
 * @throws 429 Too Many Requests if limit exceeded
 */
export function enforceRateLimitByIp(
  event: H3Event,
  config: RateLimitConfig,
): RateLimitResult {
  const clientIp = getClientIp(event)
  const result = checkRateLimit(clientIp, config)

  // Set rate limit headers
  setHeader(event, 'X-RateLimit-Limit', String(config.maxRequests))
  setHeader(event, 'X-RateLimit-Remaining', String(result.remaining))
  setHeader(event, 'X-RateLimit-Reset', result.resetAt.toISOString())

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)
    setHeader(event, 'Retry-After', String(retryAfter))

    throw createError({
      statusCode: 429,
      message: `Trop de tentatives. Réessayez dans ${formatDuration(retryAfter * 1000)}.`,
      data: {
        remaining: result.remaining,
        resetAt: result.resetAt.toISOString(),
        retryAfterSeconds: retryAfter,
      },
    })
  }

  return result
}
