import type { H3Event } from 'h3'

const REFRESH_TOKEN_COOKIE = 'refresh_token'

// Cookie expiration: 7 days (same as refresh token)
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60

/**
 * Set refresh token as HttpOnly cookie.
 * This protects against XSS attacks - JavaScript cannot access the token.
 */
export function setRefreshTokenCookie(event: H3Event, token: string): void {
  setCookie(event, REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/api/v1/auth', // Only sent to auth endpoints
  })
}

/**
 * Get refresh token from HttpOnly cookie.
 */
export function getRefreshTokenCookie(event: H3Event): string | undefined {
  return getCookie(event, REFRESH_TOKEN_COOKIE)
}

/**
 * Clear refresh token cookie (on logout or token revocation).
 */
export function clearRefreshTokenCookie(event: H3Event): void {
  deleteCookie(event, REFRESH_TOKEN_COOKIE, {
    path: '/api/v1/auth',
  })
}
