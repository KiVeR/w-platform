type RefreshFailureHandler = () => void

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'wellpack-access-token',
  REFRESH_TOKEN: 'wellpack-refresh-token',
} as const

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

class TokenRefreshManager {
  private refreshPromise: Promise<string | null> | null = null
  private failureHandlers: Set<RefreshFailureHandler> = new Set()

  getAccessToken(): string | null {
    if (!hasStorage()) return null
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  }

  saveTokens(data: { access_token: string; refresh_token: string }): void {
    if (!hasStorage()) return
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token)
  }

  clearTokens(): void {
    if (!hasStorage()) return
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  }

  onRefreshFailure(handler: RefreshFailureHandler): () => void {
    this.failureHandlers.add(handler)
    return () => { this.failureHandlers.delete(handler) }
  }

  async refreshToken(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise

    this.refreshPromise = this.doRefresh()
    try {
      return await this.refreshPromise
    }
    finally {
      this.refreshPromise = null
    }
  }

  private async doRefresh(): Promise<string | null> {
    if (!hasStorage()) return null

    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
    if (!refreshToken) {
      this.handleFailure()
      return null
    }

    try {
      const config = useRuntimeConfig()
      const response = await fetch(`${config.public.platformApiUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!response.ok) {
        this.handleFailure()
        return null
      }

      const json = await response.json()
      const data = json.data

      this.saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })

      return data.access_token
    }
    catch {
      this.handleFailure()
      return null
    }
  }

  private handleFailure(): void {
    this.clearTokens()
    this.failureHandlers.forEach(handler => handler())
  }
}

export const tokenRefreshManager = new TokenRefreshManager()
