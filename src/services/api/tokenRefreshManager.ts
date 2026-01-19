import type { RefreshResponse } from '#shared/types/api'

type RefreshFailureHandler = () => void

class TokenRefreshManager {
  private isRefreshing = false
  private refreshPromise: Promise<string | null> | null = null
  private failureHandlers: RefreshFailureHandler[] = []

  /**
   * Register a handler to be called when refresh fails (for redirect to /login)
   */
  onRefreshFailure(handler: RefreshFailureHandler): () => void {
    this.failureHandlers.push(handler)
    return () => {
      this.failureHandlers = this.failureHandlers.filter(h => h !== handler)
    }
  }

  private notifyFailure(): void {
    this.failureHandlers.forEach(handler => handler())
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined')
      return null
    return localStorage.getItem('refreshToken')
  }

  private saveTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined')
      return
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
  }

  private clearTokens(): void {
    if (typeof window === 'undefined')
      return
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  /**
   * Attempt to refresh the token.
   * Returns the new access token on success, null on failure.
   * Handles concurrent calls by returning the same promise.
   */
  async refreshToken(): Promise<string | null> {
    // If already refreshing, return existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      this.clearTokens()
      this.notifyFailure()
      return null
    }

    this.isRefreshing = true
    this.refreshPromise = this.doRefresh(refreshToken)

    try {
      return await this.refreshPromise
    }
    finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  private async doRefresh(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        this.clearTokens()
        this.notifyFailure()
        return null
      }

      const data: RefreshResponse = await response.json()
      this.saveTokens(data.accessToken, data.refreshToken)
      return data.accessToken
    }
    catch {
      this.clearTokens()
      this.notifyFailure()
      return null
    }
  }
}

export const tokenRefreshManager = new TokenRefreshManager()
