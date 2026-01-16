import type { LoginResponse, RefreshResponse } from '../../shared/types/api'
import type { UserPublic } from '../../shared/types/user'
import { defineStore } from 'pinia'

interface AuthState {
  user: UserPublic | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.accessToken && !!state.user,
    isAdmin: (state): boolean => state.user?.role === 'ADMIN',
    isEditor: (state): boolean => state.user?.role === 'EDITOR' || state.user?.role === 'ADMIN',
    fullName: (state): string => {
      if (!state.user)
        return ''
      const parts = [state.user.firstName, state.user.lastName].filter(Boolean)
      return parts.length > 0 ? parts.join(' ') : state.user.email
    },
  },

  actions: {
    // Initialize from localStorage on app start
    init() {
      if (import.meta.client) {
        const accessToken = localStorage.getItem('accessToken')
        const refreshToken = localStorage.getItem('refreshToken')
        const userJson = localStorage.getItem('user')

        if (accessToken && refreshToken && userJson) {
          this.accessToken = accessToken
          this.refreshToken = refreshToken
          try {
            this.user = JSON.parse(userJson)
          }
          catch {
            this.clearAuth()
          }
        }
      }
    },

    // Store tokens and user
    setAuth(data: LoginResponse) {
      this.accessToken = data.accessToken
      this.refreshToken = data.refreshToken
      this.user = data.user
      this.error = null

      if (import.meta.client) {
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    },

    // Update tokens after refresh
    updateTokens(data: RefreshResponse) {
      this.accessToken = data.accessToken
      this.refreshToken = data.refreshToken

      if (import.meta.client) {
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
      }
    },

    // Clear all auth data
    clearAuth() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.error = null

      if (import.meta.client) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      }
    },

    // Login
    async login(email: string, password: string): Promise<boolean> {
      this.isLoading = true
      this.error = null

      try {
        const data = await $fetch<LoginResponse>('/api/v1/auth/login', {
          method: 'POST',
          body: { email, password },
        })

        this.setAuth(data)
        return true
      }
      catch (err: unknown) {
        const error = err as { data?: { message?: string } }
        this.error = error.data?.message || 'Erreur de connexion'
        return false
      }
      finally {
        this.isLoading = false
      }
    },

    // Register
    async register(data: {
      email: string
      password: string
      firstName?: string
      lastName?: string
    }): Promise<boolean> {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<LoginResponse>('/api/v1/auth/register', {
          method: 'POST',
          body: data,
        })

        this.setAuth(response)
        return true
      }
      catch (err: unknown) {
        const error = err as { data?: { message?: string } }
        this.error = error.data?.message || 'Erreur d\'inscription'
        return false
      }
      finally {
        this.isLoading = false
      }
    },

    // Logout
    async logout(): Promise<void> {
      try {
        if (this.refreshToken) {
          await $fetch('/api/v1/auth/logout', {
            method: 'POST',
            body: { refreshToken: this.refreshToken },
          })
        }
      }
      catch {
        // Ignore logout errors
      }
      finally {
        this.clearAuth()
      }
    },

    // Refresh tokens
    async refresh(): Promise<boolean> {
      if (!this.refreshToken) {
        this.clearAuth()
        return false
      }

      try {
        const data = await $fetch<RefreshResponse>('/api/v1/auth/refresh', {
          method: 'POST',
          body: { refreshToken: this.refreshToken },
        })

        this.updateTokens(data)
        return true
      }
      catch {
        this.clearAuth()
        return false
      }
    },

    // Fetch current user
    async fetchUser(): Promise<boolean> {
      if (!this.accessToken) {
        return false
      }

      try {
        const user = await $fetch<UserPublic>('/api/v1/auth/me', {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        })

        this.user = user
        if (import.meta.client) {
          localStorage.setItem('user', JSON.stringify(user))
        }
        return true
      }
      catch {
        // Try to refresh token
        const refreshed = await this.refresh()
        if (refreshed) {
          return this.fetchUser()
        }
        this.clearAuth()
        return false
      }
    },
  },
})
