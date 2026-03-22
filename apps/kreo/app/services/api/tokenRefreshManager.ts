import type { RefreshResponse } from '#shared/types/api'

type RefreshFailureHandler = () => void

let refreshPromise: Promise<string | null> | null = null
const failureHandlers: RefreshFailureHandler[] = []

function notifyFailure(): void {
  failureHandlers.forEach(handler => handler())
}

function clearTokens(): void {
  if (typeof window === 'undefined')
    return
  localStorage.removeItem('accessToken')
  localStorage.removeItem('user')
}

function saveAccessToken(accessToken: string): void {
  if (typeof window === 'undefined')
    return
  localStorage.setItem('accessToken', accessToken)
}

async function doRefresh(): Promise<string | null> {
  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      clearTokens()
      notifyFailure()
      return null
    }

    const data: RefreshResponse = await response.json()
    saveAccessToken(data.accessToken)
    return data.accessToken
  }
  catch {
    clearTokens()
    notifyFailure()
    return null
  }
}

/**
 * Register a handler to be called when refresh fails (for redirect to /login)
 */
function onRefreshFailure(handler: RefreshFailureHandler): () => void {
  failureHandlers.push(handler)
  return () => {
    const index = failureHandlers.indexOf(handler)
    if (index > -1)
      failureHandlers.splice(index, 1)
  }
}

/**
 * Attempt to refresh the token.
 * Returns the new access token on success, null on failure.
 * Handles concurrent calls by returning the same promise.
 * Note: Refresh token is sent automatically via HttpOnly cookie.
 */
async function refreshToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = doRefresh()

  try {
    return await refreshPromise
  }
  finally {
    refreshPromise = null
  }
}

export const tokenRefreshManager = { onRefreshFailure, refreshToken }
